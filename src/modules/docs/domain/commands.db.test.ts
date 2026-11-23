import type { JSONContent } from '@tiptap/core';
import { and, eq, sql } from 'drizzle-orm';
import { describe, expect } from 'vitest';

import { createShelf, ITEM_ROW_BYTES } from '@/modules/shelves/api';
import { createUser } from '@/server/auth/testing';
import type { Ctx } from '@/server/ctx/load-ctx';
import { ctxOf, withStorageQuota } from '@/server/ctx/testing';
import type { Db } from '@/server/db/client';
import { item } from '@/server/db/schema/shelves';
import { dbTest as test } from '@/server/db/testing';

import { LARGEST_DOC_BYTES } from '../core/save-limits';
import { saveDoc } from './commands';
import { getDoc } from './queries';

const NOW = new Date('2026-11-22T09:00:00Z');
const MISSING_ID = '019a9c3e-0000-7000-8000-000000000000';
const BLOCK_ID = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f01';
const OTHER_BLOCK_ID = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f02';

function text(value: string): JSONContent {
  return { type: 'text', text: value };
}

function paragraph(
  value: string,
  blockId: string | null = BLOCK_ID,
): JSONContent {
  return { type: 'paragraph', attrs: { blockId }, content: [text(value)] };
}

function docOf(...content: JSONContent[]): JSONContent {
  return { type: 'doc', content };
}

const VERBS_BODY = docOf(
  {
    type: 'heading',
    attrs: { blockId: BLOCK_ID, level: 2 },
    content: [text('Present tense')],
  },
  {
    type: 'bulletList',
    content: [
      {
        type: 'listItem',
        attrs: { blockId: OTHER_BLOCK_ID },
        content: [paragraph('yo hablo', null)],
      },
    ],
  },
);

async function signIn(db: Db, email: string) {
  return ctxOf(db, await createUser(db, email), NOW);
}

async function insertItem(ctx: Ctx, kind: 'doc' | 'sheet' = 'doc') {
  const shelf = await createShelf(ctx, { name: 'Spanish' });
  const [inserted] = await ctx.db
    .insert(item)
    .values({
      userId: ctx.userId,
      shelfId: shelf.id,
      kind,
      title: 'Verbs',
      position: 'a0',
    })
    .returning({ id: item.id });
  if (!inserted) throw new Error('The insert returned no item');
  return inserted.id;
}

async function rowOf(db: Db, id: string) {
  const [found] = await db
    .select({
      content: item.content,
      plainText: item.plainText,
      sizeBytes: item.sizeBytes,
      version: item.version,
    })
    .from(item)
    .where(eq(item.id, id));
  return found;
}

async function isFoundBySearch(db: Db, id: string, word: string) {
  const found = await db
    .select({ id: item.id })
    .from(item)
    .where(
      and(
        eq(item.id, id),
        sql`${item.search} @@ to_tsquery('simple', ${word})`,
      ),
    );
  return found.length === 1;
}

describe('saveDoc', () => {
  test('writes the body, its text for search and its size, and counts the save in the version it returns', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);

    expect(await saveDoc(ada, { id, version: 1, content: VERBS_BODY })).toEqual(
      { version: 2 },
    );

    const row = await rowOf(db, id);
    expect(row?.content).toEqual(VERBS_BODY);
    expect(row?.plainText).toBe('Present tense\nyo hablo');
    expect(row?.sizeBytes).toBe(
      new TextEncoder().encode(JSON.stringify(VERBS_BODY)).byteLength,
    );
    expect(row?.version).toBe(2);
    expect(await isFoundBySearch(db, id, 'hablo')).toBe(true);
    expect(await isFoundBySearch(db, id, 'verbs')).toBe(true);
  });

  test('takes the next save from the version the last one returned', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);
    const first = await saveDoc(ada, {
      id,
      version: 1,
      content: docOf(paragraph('hablo')),
    });

    const second = await saveDoc(ada, {
      id,
      version: first.version,
      content: docOf(paragraph('hablo, hablas')),
    });

    expect(second).toEqual({ version: 3 });
    const content = docOf(paragraph('hablo, hablas'));
    expect(await getDoc(ada, { id })).toEqual({
      id,
      content,
      version: 3,
      sizeBytes: new TextEncoder().encode(JSON.stringify(content)).byteLength,
    });
  });

  test('answers CONFLICT for a save from a version the doc has moved past, and keeps what is there', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);
    await saveDoc(ada, { id, version: 1, content: docOf(paragraph('hablo')) });

    await expect(
      saveDoc(ada, { id, version: 1, content: docOf(paragraph('como')) }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(await rowOf(db, id)).toMatchObject({
      content: docOf(paragraph('hablo')),
      plainText: 'hablo',
      version: 2,
    });
  });

  test("answers NOT_FOUND for another user's doc, a missing one and a sheet, and writes nothing", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bea = await signIn(db, 'bea@example.com');
    const adasDoc = await insertItem(ada);
    const adasSheet = await insertItem(ada, 'sheet');

    for (const [ctx, id] of [
      [bea, adasDoc],
      [ada, MISSING_ID],
      [ada, adasSheet],
    ] as const) {
      await expect(
        saveDoc(ctx, { id, version: 1, content: docOf(paragraph('hola')) }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    }
    expect(await rowOf(db, adasDoc)).toMatchObject({
      content: null,
      version: 1,
    });
    expect(await rowOf(db, adasSheet)).toMatchObject({
      content: null,
      version: 1,
    });
  });

  test('stores the doc as the schema reads it, so an attribute it does not know is not kept', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);

    await saveDoc(ada, {
      id,
      version: 1,
      content: docOf({
        type: 'paragraph',
        attrs: { blockId: BLOCK_ID, onclick: 'alert(1)' },
        content: [text('hola')],
      }),
    });

    expect((await rowOf(db, id))?.content).toEqual(docOf(paragraph('hola')));
  });

  test.for<[string, unknown]>([
    ['a root that is not a doc', paragraph('hola')],
    ['a node the editor does not have', docOf({ type: 'image' })],
    [
      'a mark the editor does not have',
      docOf({
        type: 'paragraph',
        content: [{ ...text('hola'), marks: [{ type: 'underline' }] }],
      }),
    ],
    [
      'a heading level the editor does not have',
      docOf({ type: 'heading', attrs: { level: 7 }, content: [text('hola')] }),
    ],
    ['a block id that is not a uuid', docOf(paragraph('hola', 'verbs'))],
    [
      'a checklist item ticked with something other than true or false',
      docOf({
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: 'yes' },
            content: [paragraph('hablar')],
          },
        ],
      }),
    ],
    ['an empty doc', docOf()],
    ['text instead of a doc', 'hola'],
    ['nothing', null],
  ])(
    'refuses %s with VALIDATION and writes nothing',
    async ([, content], { db }) => {
      const ada = await signIn(db, 'ada@example.com');
      const id = await insertItem(ada);

      await expect(
        saveDoc(ada, { id, version: 1, content: content as JSONContent }),
      ).rejects.toMatchObject({ code: 'VALIDATION' });
      expect(await rowOf(db, id)).toMatchObject({ content: null, version: 1 });
    },
  );

  test('refuses a version that is not a whole number from 1 up', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);

    for (const version of [0, 1.5, 2 ** 31]) {
      await expect(
        saveDoc(ada, { id, version, content: docOf(paragraph('hola')) }),
      ).rejects.toMatchObject({ code: 'VALIDATION' });
    }
  });

  test('keeps a doc as long as a doc may be, searchable even when no word repeats', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);
    const content = bodyOfDifferentWords(LARGEST_DOC_BYTES);

    await saveDoc(ada, { id, version: 1, content });

    expect((await rowOf(db, id))?.sizeBytes).toBe(LARGEST_DOC_BYTES);
    expect(await isFoundBySearch(db, id, uniqueWord(70_000))).toBe(true);
  });

  test('answers LIMIT for a body longer than a doc may be, and writes nothing', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);
    const content = bodyOfDifferentWords(LARGEST_DOC_BYTES + 1);

    await expect(
      saveDoc(ada, { id, version: 1, content }),
    ).rejects.toMatchObject({ code: 'LIMIT' });
    expect(await rowOf(db, id)).toMatchObject({ content: null, version: 1 });
  });
});

describe('saveDoc against the storage quota', () => {
  const SHORT = docOf(paragraph('hablo'));
  const LONG = docOf(paragraph('hablo, hablas, habla, hablamos, habláis'));

  test('answers STORAGE_FULL for a save that would take the user past the quota, and keeps what is there', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);
    await saveDoc(ada, { id, version: 1, content: SHORT });
    const full = await withStorageQuota(ada, sizeOf(SHORT) + ITEM_ROW_BYTES);

    await expect(
      saveDoc(full, { id, version: 2, content: LONG }),
    ).rejects.toMatchObject({ code: 'STORAGE_FULL' });
    expect(await rowOf(db, id)).toMatchObject({ content: SHORT, version: 2 });
  });

  test('saves a body that grows up to the quota itself', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);
    await saveDoc(ada, { id, version: 1, content: SHORT });
    const full = await withStorageQuota(ada, sizeOf(LONG) + ITEM_ROW_BYTES);

    expect(await saveDoc(full, { id, version: 2, content: LONG })).toEqual({
      version: 3,
    });
  });

  test('lets a save that keeps or shrinks the body through even past the quota, so room can be made', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);
    await saveDoc(ada, { id, version: 1, content: LONG });
    const over = await withStorageQuota(ada, 0);
    const sameSize = docOf(
      paragraph('hablo, hablas, habla, hablamos, habláin'),
    );

    expect(await saveDoc(over, { id, version: 2, content: sameSize })).toEqual({
      version: 3,
    });
    expect(await saveDoc(over, { id, version: 3, content: SHORT })).toEqual({
      version: 4,
    });
    expect((await rowOf(db, id))?.sizeBytes).toBe(sizeOf(SHORT));
  });

  test("counts the user's other items and 1 kB for each, but never another user's", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bea = await signIn(db, 'bea@example.com');
    const id = await insertItem(ada);
    const other = await insertItem(ada);
    await saveDoc(ada, { id: other, version: 1, content: VERBS_BODY });
    const beasDoc = await insertItem(bea);
    await saveDoc(bea, { id: beasDoc, version: 1, content: LONG });
    const room = sizeOf(VERBS_BODY) + sizeOf(LONG) + 2 * ITEM_ROW_BYTES;

    await expect(
      saveDoc(await withStorageQuota(ada, room - 1), {
        id,
        version: 1,
        content: LONG,
      }),
    ).rejects.toMatchObject({ code: 'STORAGE_FULL' });
    expect(
      await saveDoc(await withStorageQuota(ada, room), {
        id,
        version: 1,
        content: LONG,
      }),
    ).toEqual({ version: 2 });
  });

  test('answers CONFLICT, not STORAGE_FULL, for a save from a version the doc has moved past', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);
    await saveDoc(ada, { id, version: 1, content: SHORT });
    const full = await withStorageQuota(ada, 0);

    await expect(
      saveDoc(full, { id, version: 1, content: LONG }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});

function uniqueWord(index: number) {
  return `w${index.toString(36)}`;
}

function sizeOf(content: JSONContent) {
  return new TextEncoder().encode(JSON.stringify(content)).byteLength;
}

function bodyOfDifferentWords(bytes: number) {
  const room = bytes - sizeOf(docOf(paragraph('')));
  const words: string[] = [];
  let length = -1;
  for (let index = 0; length + 1 + uniqueWord(index).length <= room; index++) {
    words.push(uniqueWord(index));
    length += 1 + uniqueWord(index).length;
  }
  return docOf(paragraph(words.join(' ') + 'z'.repeat(room - length)));
}
