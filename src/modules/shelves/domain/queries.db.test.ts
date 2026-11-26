import { and, eq } from 'drizzle-orm';
import { describe, expect } from 'vitest';

import { syncCards } from '@/modules/cards/api';
import { createUser } from '@/server/auth/testing';
import type { Ctx } from '@/server/ctx/load-ctx';
import { ctxOf, withStorageQuota } from '@/server/ctx/testing';
import type { Db } from '@/server/db/client';
import { card } from '@/server/db/schema/cards';
import { item } from '@/server/db/schema/shelves';
import { dbTest as test } from '@/server/db/testing';

import { ITEM_ROW_BYTES, LARGEST_LISTED } from '../core/storage';
import { createShelf } from './commands';
import { createItem, moveItem } from './item-commands';
import { getNavigation, getShelf, getStorage } from './queries';

const NOW = new Date('2026-11-19T09:00:00Z');

describe('getNavigation', () => {
  test("gives the signed-in user's shelves in their order, never another user's", async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const bea = await ctxOf(db, await createUser(db, 'bea@example.com'), NOW);
    const spanish = await createShelf(ada, { name: 'Spanish' });
    await createShelf(bea, { name: 'Chess' });
    const guitar = await createShelf(ada, { name: 'Guitar' });

    expect((await getNavigation(ada)).shelves).toEqual([spanish, guitar]);
  });

  test("gives the signed-in user's items with their shelf, in each shelf's order, never another user's", async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const bea = await ctxOf(db, await createUser(db, 'bea@example.com'), NOW);
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    const chess = await createShelf(bea, { name: 'Chess' });
    const verbs = await createItem(ada, {
      shelfId: spanish.id,
      kind: 'doc',
      title: 'Verbs',
    });
    const chords = await createItem(ada, {
      shelfId: guitar.id,
      kind: 'doc',
      title: 'Chords',
    });
    const words = await createItem(ada, {
      shelfId: spanish.id,
      kind: 'sheet',
      title: 'Words',
    });
    await createItem(bea, {
      shelfId: chess.id,
      kind: 'doc',
      title: 'Openings',
    });
    await moveItem(ada, { id: words.id, shelfId: spanish.id });

    const { items } = await getNavigation(ada);

    expect(items.filter(({ shelfId }) => shelfId === spanish.id)).toEqual([
      { id: words.id, shelfId: spanish.id, kind: 'sheet', title: 'Words' },
      verbs,
    ]);
    expect(items.filter(({ shelfId }) => shelfId === guitar.id)).toEqual([
      chords,
    ]);
    expect(items).toHaveLength(3);
  });
});

async function docOfSize(
  ctx: Ctx,
  {
    shelfId,
    title,
    sizeBytes,
  }: { shelfId: string; title: string; sizeBytes: number },
) {
  const created = await createItem(ctx, { shelfId, kind: 'doc', title });
  await setSize(ctx.db, created.id, sizeBytes);
  return created;
}

async function setSize(db: Db, id: string, sizeBytes: number) {
  await db.update(item).set({ sizeBytes }).where(eq(item.id, id));
}

describe('getStorage', () => {
  test("adds up the bodies of the user's items and 1 kB for each, never another user's", async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const bea = await ctxOf(db, await createUser(db, 'bea@example.com'), NOW);
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const chess = await createShelf(bea, { name: 'Chess' });
    await docOfSize(ada, {
      shelfId: spanish.id,
      title: 'Verbs',
      sizeBytes: 3_000,
    });
    await createItem(ada, {
      shelfId: spanish.id,
      kind: 'sheet',
      title: 'Words',
    });
    await docOfSize(bea, {
      shelfId: chess.id,
      title: 'Openings',
      sizeBytes: 9_000,
    });

    expect((await getStorage(ada)).usedBytes).toBe(3_000 + 2 * ITEM_ROW_BYTES);
  });

  test("lists the largest shelves and docs, largest first, each with the room it takes, never another user's", async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const bea = await ctxOf(db, await createUser(db, 'bea@example.com'), NOW);
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    await createShelf(ada, { name: 'Empty' });
    const chess = await createShelf(bea, { name: 'Chess' });
    const verbs = await docOfSize(ada, {
      shelfId: spanish.id,
      title: 'Verbs',
      sizeBytes: 3_000,
    });
    const food = await docOfSize(ada, {
      shelfId: spanish.id,
      title: 'Food',
      sizeBytes: 1_000,
    });
    const chords = await docOfSize(ada, {
      shelfId: guitar.id,
      title: 'Chords',
      sizeBytes: 6_000,
    });
    await docOfSize(bea, {
      shelfId: chess.id,
      title: 'Openings',
      sizeBytes: 9_000,
    });

    const { shelves, docs } = await getStorage(ada);

    expect(shelves).toEqual([
      { ...guitar, bytes: 6_000 + ITEM_ROW_BYTES },
      { ...spanish, bytes: 4_000 + 2 * ITEM_ROW_BYTES },
    ]);
    expect(docs).toEqual([
      {
        id: chords.id,
        title: 'Chords',
        color: guitar.color,
        bytes: 6_000 + ITEM_ROW_BYTES,
      },
      {
        id: verbs.id,
        title: 'Verbs',
        color: spanish.color,
        bytes: 3_000 + ITEM_ROW_BYTES,
      },
      {
        id: food.id,
        title: 'Food',
        color: spanish.color,
        bytes: 1_000 + ITEM_ROW_BYTES,
      },
    ]);
  });

  test('lists five of each at most, and docs only, not sheets', async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    for (let index = 0; index <= LARGEST_LISTED; index += 1) {
      const shelf = await createShelf(ada, { name: `Shelf ${String(index)}` });
      await docOfSize(ada, {
        shelfId: shelf.id,
        title: `Doc ${String(index)}`,
        sizeBytes: index,
      });
    }
    const [shelf] = (await getNavigation(ada)).shelves;
    const words = await createItem(ada, {
      shelfId: shelf?.id ?? '',
      kind: 'sheet',
      title: 'Words',
    });
    await setSize(db, words.id, 1_000_000);

    const { shelves, docs } = await getStorage(ada);

    expect(shelves).toHaveLength(LARGEST_LISTED);
    expect(docs.map(({ title }) => title)).toEqual([
      'Doc 5',
      'Doc 4',
      'Doc 3',
      'Doc 2',
      'Doc 1',
    ]);
  });

  test("gives a new user nothing used, nothing listed, and the user's own quota", async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);

    expect(await getStorage(await withStorageQuota(ada, 50_000_000))).toEqual({
      usedBytes: 0,
      quotaBytes: 50_000_000,
      shelves: [],
      docs: [],
    });
  });
});

function cardsIn(ctx: Ctx, itemId: string, fronts: string[]) {
  return syncCards(
    ctx,
    itemId,
    fronts.map((front, position) => ({
      blockId: blockIdOf(itemId, position),
      position,
      front,
      back: '',
    })),
  );
}

function blockIdOf(itemId: string, position: number) {
  return `${itemId.slice(0, -2)}${String(position).padStart(2, '0')}`;
}

async function toReview(ctx: Ctx, itemId: string, position: number) {
  await ctx.db
    .update(card)
    .set({ status: 'review' })
    .where(
      and(
        eq(card.itemId, itemId),
        eq(card.blockId, blockIdOf(itemId, position)),
      ),
    );
}

describe('getShelf', () => {
  test("counts each doc's live cards and those to review, only for the docs on that shelf that have cards", async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    const kitchen = await createItem(ada, {
      shelfId: spanish.id,
      kind: 'doc',
      title: 'Kitchen',
    });
    const numbers = await createItem(ada, {
      shelfId: spanish.id,
      kind: 'doc',
      title: 'Numbers',
    });
    await createItem(ada, { shelfId: spanish.id, kind: 'doc', title: 'Notes' });
    const chords = await createItem(ada, {
      shelfId: guitar.id,
      kind: 'doc',
      title: 'Chords',
    });
    await cardsIn(ada, kitchen.id, ['la cocina', 'la nevera', 'el horno']);
    await toReview(ada, kitchen.id, 0);
    await toReview(ada, kitchen.id, 2);
    await cardsIn(ada, numbers.id, ['uno', 'dos']);
    await cardsIn(ada, chords.id, ['C major']);

    expect(await getShelf(ada, { id: spanish.id })).toEqual({
      cardCounts: {
        [kitchen.id]: { cards: 3, toReview: 2 },
        [numbers.id]: { cards: 2, toReview: 0 },
      },
    });
  });

  test('stops counting a card the moment it leaves its doc, though its row stays for a week', async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const kitchen = await createItem(ada, {
      shelfId: spanish.id,
      kind: 'doc',
      title: 'Kitchen',
    });
    const numbers = await createItem(ada, {
      shelfId: spanish.id,
      kind: 'doc',
      title: 'Numbers',
    });
    await cardsIn(ada, kitchen.id, ['la cocina', 'la nevera']);
    await toReview(ada, kitchen.id, 1);
    await cardsIn(ada, kitchen.id, ['la cocina']);
    await cardsIn(ada, numbers.id, ['uno']);
    await cardsIn(ada, numbers.id, []);

    expect(await getShelf(ada, { id: spanish.id })).toEqual({
      cardCounts: { [kitchen.id]: { cards: 1, toReview: 0 } },
    });
    expect(
      await db.select().from(card).where(eq(card.itemId, numbers.id)),
    ).toHaveLength(1);
  });

  test("answers NOT_FOUND for a missing shelf or another user's", async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const bea = await ctxOf(db, await createUser(db, 'bea@example.com'), NOW);
    const chess = await createShelf(bea, { name: 'Chess' });
    const openings = await createItem(bea, {
      shelfId: chess.id,
      kind: 'doc',
      title: 'Openings',
    });
    await cardsIn(bea, openings.id, ['e4']);

    await expect(getShelf(ada, { id: chess.id })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(
      getShelf(ada, { id: '019a9c3e-0000-7000-8000-000000000000' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('answers VALIDATION for an id that is not a uuid', async ({ db }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);

    await expect(getShelf(ada, { id: 'spanish' })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
  });
});
