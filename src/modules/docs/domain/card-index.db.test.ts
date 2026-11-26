import type { JSONContent } from '@tiptap/core';
import { and, asc, eq } from 'drizzle-orm';
import { describe, expect } from 'vitest';

import type { CardStatus } from '@/lib/card-statuses';
import { createShelf } from '@/modules/shelves/api';
import { createUser } from '@/server/auth/testing';
import type { Ctx } from '@/server/ctx/load-ctx';
import { ctxOf } from '@/server/ctx/testing';
import type { Db } from '@/server/db/client';
import { card } from '@/server/db/schema/cards';
import { item } from '@/server/db/schema/shelves';
import { dbTest as test } from '@/server/db/testing';

import { saveDoc } from './commands';
import { getDoc } from './queries';

const NOW = new Date('2026-11-26T09:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const KITCHEN = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f01';
const FRIDGE = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f02';

function text(value: string): JSONContent {
  return { type: 'text', text: value };
}

function paragraph(value: string): JSONContent {
  return {
    type: 'paragraph',
    attrs: { blockId: null },
    content: [text(value)],
  };
}

function cardOf(blockId: string | null, question: string, answer: string) {
  return {
    type: 'details',
    attrs: { blockId },
    content: [
      { type: 'detailsSummary', content: [text(question)] },
      { type: 'detailsContent', content: [paragraph(answer)] },
    ],
  };
}

const COCINA = cardOf(KITCHEN, 'la cocina', 'the kitchen');
const NEVERA = cardOf(FRIDGE, 'la nevera', 'the fridge');

function docOf(...content: JSONContent[]): JSONContent {
  return { type: 'doc', content };
}

async function signIn(db: Db, email: string) {
  return ctxOf(db, await createUser(db, email), NOW);
}

function later(ctx: Ctx, days: number) {
  return { ...ctx, now: new Date(ctx.now.getTime() + days * DAY_MS) };
}

async function insertDoc(ctx: Ctx, title = 'Kitchen') {
  const shelf = await createShelf(ctx, { name: 'Spanish' });
  const [inserted] = await ctx.db
    .insert(item)
    .values({
      userId: ctx.userId,
      shelfId: shelf.id,
      kind: 'doc',
      title,
      position: 'a0',
    })
    .returning({ id: item.id });
  if (!inserted) throw new Error('The insert returned no item');
  return inserted.id;
}

async function save(ctx: Ctx, id: string, ...content: JSONContent[]) {
  const { version } = await getDoc(ctx, { id });
  return saveDoc(ctx, { id, version, content: docOf(...content) });
}

function cardsOf(db: Db, itemId: string) {
  return db
    .select({
      blockId: card.blockId,
      position: card.position,
      front: card.front,
      back: card.back,
      status: card.status,
      removedAt: card.removedAt,
    })
    .from(card)
    .where(eq(card.itemId, itemId))
    .orderBy(asc(card.position), asc(card.blockId));
}

async function rateCard(db: Db, itemId: string, status: CardStatus) {
  await db
    .update(card)
    .set({ status })
    .where(and(eq(card.itemId, itemId), eq(card.blockId, KITCHEN)));
}

async function statusesOf(ctx: Ctx, id: string) {
  return (await getDoc(ctx, { id })).cardStatuses;
}

describe('saveDoc and the card index', () => {
  test("indexes the doc's cards in doc order, the question as text and the answer as Markdown, each one new", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertDoc(ada);

    await save(ada, id, paragraph('Rooms'), COCINA, NEVERA);

    expect(await cardsOf(db, id)).toEqual([
      {
        blockId: KITCHEN,
        position: 0,
        front: 'la cocina',
        back: 'the kitchen\n',
        status: 'new',
        removedAt: null,
      },
      {
        blockId: FRIDGE,
        position: 1,
        front: 'la nevera',
        back: 'the fridge\n',
        status: 'new',
        removedAt: null,
      },
    ]);
    expect(await statusesOf(ada, id)).toEqual({
      [KITCHEN]: 'new',
      [FRIDGE]: 'new',
    });
  });

  test("keeps a card's status when its question, its answer or its place changes", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertDoc(ada);
    await save(ada, id, COCINA, NEVERA);
    await rateCard(db, id, 'got_it');

    await save(ada, id, NEVERA, cardOf(KITCHEN, 'la cocina grande', 'big'));

    expect(await cardsOf(db, id)).toMatchObject([
      { blockId: FRIDGE, position: 0, status: 'new' },
      {
        blockId: KITCHEN,
        position: 1,
        front: 'la cocina grande',
        back: 'big\n',
        status: 'got_it',
      },
    ]);
  });

  test('keeps the status of a card cut out of the doc and pasted back in', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertDoc(ada);
    await save(ada, id, COCINA, NEVERA);
    await rateCard(db, id, 'review');

    await save(ada, id, NEVERA);
    expect(await statusesOf(ada, id)).toEqual({ [FRIDGE]: 'new' });

    await save(later(ada, 6), id, NEVERA, COCINA);
    expect(await statusesOf(ada, id)).toEqual({
      [FRIDGE]: 'new',
      [KITCHEN]: 'review',
    });
    expect(await cardsOf(db, id)).toMatchObject([
      { blockId: FRIDGE, removedAt: null },
      { blockId: KITCHEN, removedAt: null },
    ]);
  });

  test('makes a card copied into another doc a new card there, and leaves the first one as it was', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const kitchen = await insertDoc(ada, 'Kitchen');
    const copy = await insertDoc(ada, 'Kitchen, again');
    await save(ada, kitchen, COCINA);
    await rateCard(db, kitchen, 'got_it');

    await save(ada, copy, COCINA);

    expect(await statusesOf(ada, copy)).toEqual({ [KITCHEN]: 'new' });
    expect(await statusesOf(ada, kitchen)).toEqual({ [KITCHEN]: 'got_it' });
  });

  test('drops a card that left the doc from its statuses at once, and from the database seven days later', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertDoc(ada);
    await save(ada, id, COCINA, NEVERA);

    await save(ada, id, NEVERA);
    expect(await statusesOf(ada, id)).toEqual({ [FRIDGE]: 'new' });
    expect(await cardsOf(db, id)).toMatchObject([
      { blockId: KITCHEN, removedAt: NOW },
      { blockId: FRIDGE, removedAt: null },
    ]);

    await save(later(ada, 7), id, NEVERA, paragraph('hola'));
    expect(await cardsOf(db, id)).toHaveLength(2);

    await save(later(ada, 7.01), id, NEVERA);
    expect(await cardsOf(db, id)).toMatchObject([{ blockId: FRIDGE }]);
  });

  test('brings a card back as a new one once its row is gone', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertDoc(ada);
    await save(ada, id, COCINA, NEVERA);
    await rateCard(db, id, 'got_it');
    await save(ada, id, NEVERA);

    await save(later(ada, 8), id, NEVERA, COCINA);

    expect(await statusesOf(ada, id)).toEqual({
      [FRIDGE]: 'new',
      [KITCHEN]: 'new',
    });
  });

  test('leaves a card row unwritten when nothing on it changed', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertDoc(ada);
    await save(ada, id, COCINA, NEVERA);
    const [kitchenBefore] = await updatedAtOf(db, KITCHEN);

    await save(later(ada, 1), id, COCINA, cardOf(FRIDGE, 'la nevera', 'cold'));

    expect(await updatedAtOf(db, KITCHEN)).toEqual([kitchenBefore]);
    expect(await updatedAtOf(db, FRIDGE)).toEqual([
      { updatedAt: later(ada, 1).now },
    ]);
  });

  test('answers VALIDATION for a doc in which two cards share a block id, or a card has none, and writes nothing', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertDoc(ada);
    const twins = docOf(COCINA, cardOf(KITCHEN, 'la nevera', 'the fridge'));
    const nameless = docOf(cardOf(null, 'la cocina', 'the kitchen'));

    for (const content of [twins, nameless]) {
      await expect(
        saveDoc(ada, { id, version: 1, content }),
      ).rejects.toMatchObject({ code: 'VALIDATION' });
    }
    expect(await getDoc(ada, { id })).toMatchObject({
      content: null,
      version: 1,
    });
    expect(await cardsOf(db, id)).toEqual([]);
  });

  test('indexes nothing when the save is refused', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = await insertDoc(ada);
    await save(ada, id, NEVERA);

    await expect(
      saveDoc(ada, { id, version: 1, content: docOf(COCINA) }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });

    expect(await cardsOf(db, id)).toMatchObject([
      { blockId: FRIDGE, removedAt: null },
    ]);
  });

  test("leaves another user's cards alone when a save names their doc", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bob = await signIn(db, 'bob@example.com');
    const id = await insertDoc(ada);
    await save(ada, id, COCINA);

    await expect(
      saveDoc(bob, { id, version: 2, content: docOf(NEVERA) }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    expect(await cardsOf(db, id)).toMatchObject([
      { blockId: KITCHEN, removedAt: null },
    ]);
  });
});

function updatedAtOf(db: Db, blockId: string) {
  return db
    .select({ updatedAt: card.updatedAt })
    .from(card)
    .where(eq(card.blockId, blockId));
}
