import { eq } from 'drizzle-orm';
import { describe, expect } from 'vitest';

import { createUser } from '@/server/auth/testing';
import type { Ctx } from '@/server/ctx/load-ctx';
import { ctxOf } from '@/server/ctx/testing';
import type { Db } from '@/server/db/client';
import { card } from '@/server/db/schema/cards';
import { item, shelf } from '@/server/db/schema/shelves';
import { dbTest as test } from '@/server/db/testing';

import { cardStatusesIn } from './queries';
import { syncCards } from './sync-cards';

const NOW = new Date('2026-11-26T09:00:00Z');
const KITCHEN = {
  blockId: '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f01',
  position: 0,
  front: 'la cocina',
  back: 'the kitchen\n',
};

const FRIDGE = {
  blockId: '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f02',
  position: 1,
  front: 'la nevera',
  back: 'the fridge\n',
};

function eightDaysLater(ctx: Ctx) {
  return { ...ctx, now: new Date(ctx.now.getTime() + 8 * 24 * 60 * 60 * 1000) };
}

async function signIn(db: Db, email: string) {
  return ctxOf(db, await createUser(db, email), NOW);
}

async function insertDoc(ctx: Ctx) {
  const [spanish] = await ctx.db
    .insert(shelf)
    .values({
      userId: ctx.userId,
      name: 'Spanish',
      color: 'violet',
      position: 'a0',
    })
    .returning({ id: shelf.id });
  if (!spanish) throw new Error('The insert returned no shelf');
  const [inserted] = await ctx.db
    .insert(item)
    .values({
      userId: ctx.userId,
      shelfId: spanish.id,
      kind: 'doc',
      title: 'Kitchen',
      position: 'a0',
    })
    .returning({ id: item.id });
  if (!inserted) throw new Error('The insert returned no item');
  return inserted.id;
}

describe("another user's cards", () => {
  test("can't be read: their statuses come back empty", async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bob = await signIn(db, 'bob@example.com');
    const id = await insertDoc(ada);
    await syncCards(ada, id, [KITCHEN]);

    expect(await cardStatusesIn(ada, id)).toEqual({
      [KITCHEN.blockId]: 'new',
    });
    expect(await cardStatusesIn(bob, id)).toEqual({});
  });

  test("can't be written: the database refuses a card in someone else's doc", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bob = await signIn(db, 'bob@example.com');
    const id = await insertDoc(ada);

    await expect(syncCards(bob, id, [KITCHEN])).rejects.toThrow();
  });

  test("can't be marked removed or deleted by a sync of someone else's", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bob = await signIn(db, 'bob@example.com');
    const id = await insertDoc(ada);
    await syncCards(ada, id, [KITCHEN, FRIDGE]);
    await syncCards(ada, id, [KITCHEN]);

    await syncCards(eightDaysLater(bob), id, []);

    expect(
      await db
        .select({ blockId: card.blockId, removedAt: card.removedAt })
        .from(card)
        .where(eq(card.itemId, id))
        .orderBy(card.position),
    ).toEqual([
      { blockId: KITCHEN.blockId, removedAt: null },
      { blockId: FRIDGE.blockId, removedAt: NOW },
    ]);
  });
});
