import { eq } from 'drizzle-orm';
import { describe, expect } from 'vitest';

import { createShelf } from '@/modules/shelves/api';
import { createUser } from '@/server/auth/testing';
import type { Ctx } from '@/server/ctx/load-ctx';
import { ctxOf } from '@/server/ctx/testing';
import type { Db } from '@/server/db/client';
import { item } from '@/server/db/schema/shelves';
import { dbTest as test } from '@/server/db/testing';

import { getDoc } from './queries';

const NOW = new Date('2026-11-21T09:00:00Z');
const MISSING_ID = '019a9c3e-0000-7000-8000-000000000000';
const SAVED_BODY = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { blockId: '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f01' },
      content: [{ type: 'text', text: 'Hablo, hablas, habla' }],
    },
  ],
};

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

describe('getDoc', () => {
  test('gives a new doc as an empty body at version 1, taking no room', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);

    expect(await getDoc(ada, { id })).toEqual({
      id,
      content: null,
      version: 1,
      sizeBytes: 0,
      cardStatuses: {},
    });
  });

  test('gives a saved doc its body, version and size as they were saved', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertItem(ada);
    await db
      .update(item)
      .set({ content: SAVED_BODY, version: 3, sizeBytes: 2048 })
      .where(eq(item.id, id));

    expect(await getDoc(ada, { id })).toEqual({
      id,
      content: SAVED_BODY,
      version: 3,
      sizeBytes: 2048,
      cardStatuses: {},
    });
  });

  test("answers NOT_FOUND for another user's doc, a missing one and a sheet", async ({
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
      await expect(getDoc(ctx, { id })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    }
  });

  test('answers VALIDATION for an id that is not a uuid', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');

    await expect(getDoc(ada, { id: 'verbs' })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
  });
});
