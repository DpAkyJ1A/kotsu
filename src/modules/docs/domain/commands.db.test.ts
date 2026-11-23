import type { JSONContent } from '@tiptap/core';
import { and, eq, sql } from 'drizzle-orm';
import { describe, expect } from 'vitest';

import { createShelf } from '@/modules/shelves/api';
import { createUser } from '@/server/auth/testing';
import type { Ctx } from '@/server/ctx/load-ctx';
import { ctxOf } from '@/server/ctx/testing';
import type { Db } from '@/server/db/client';
import { item } from '@/server/db/schema/shelves';
import { dbTest as test } from '@/server/db/testing';

import { LARGEST_SAVE_BYTES } from '../core/save-limits';
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
    expect(await getDoc(ada, { id })).toEqual({
      id,
      content: docOf(paragraph('hablo, hablas')),
      version: 3,
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

  test('keeps a body as long as a save may be searchable when its words repeat, as the words of a text do', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);
    const content = docOf(paragraph(textOf(LARGEST_SAVE_BYTES, repeatedWord)));

    await saveDoc(ada, { id, version: 1, content });

    expect((await rowOf(db, id))?.sizeBytes).toBeGreaterThan(
      LARGEST_SAVE_BYTES * 0.98,
    );
    expect(await isFoundBySearch(db, id, 'hablamos')).toBe(true);
  });

  test('answers LIMIT for a body with more different words than the search index can hold', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);
    const content = docOf(paragraph(textOf(LARGEST_SAVE_BYTES, uniqueWord)));

    await expect(
      saveDoc(ada, { id, version: 1, content }),
    ).rejects.toMatchObject({ code: 'LIMIT' });
  });
});

const VERB_FORMS = [
  'hablo',
  'hablas',
  'habla',
  'hablamos',
  'habláis',
  'hablan',
];

function repeatedWord(index: number) {
  return VERB_FORMS[index % VERB_FORMS.length] ?? '';
}

function uniqueWord(index: number) {
  return `w${index.toString(36)}`;
}

function textOf(bytes: number, wordAt: (index: number) => string) {
  const words: string[] = [];
  let length = 0;
  for (let index = 0; length < bytes * 0.98; index++) {
    const word = wordAt(index);
    words.push(word);
    length += new TextEncoder().encode(word).byteLength + 1;
  }
  return words.join(' ');
}
