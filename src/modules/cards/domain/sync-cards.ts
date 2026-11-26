import 'server-only';

import { and, eq, lt, notInArray, sql } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

import type { Ctx } from '@/server/ctx/load-ctx';
import { card } from '@/server/db/schema/cards';

import { liveCards } from './live-cards';

const REMOVED_CARD_KEPT_MS = 7 * 24 * 60 * 60 * 1000;

type CardInDoc = {
  blockId: string;
  position: number;
  front: string;
  back: string;
};

export async function syncCards(
  ctx: Ctx,
  itemId: string,
  cards: readonly CardInDoc[],
) {
  await forgetCardsRemovedLongAgo(ctx, itemId);
  await writeCards(ctx, itemId, cards);
  await markMissingCardsRemoved(ctx, itemId, cards);
}

function forgetCardsRemovedLongAgo(ctx: Ctx, itemId: string) {
  const keptSince = new Date(ctx.now.getTime() - REMOVED_CARD_KEPT_MS);
  return ctx.db
    .delete(card)
    .where(
      and(
        eq(card.userId, ctx.userId),
        eq(card.itemId, itemId),
        lt(card.removedAt, keptSince),
      ),
    );
}

async function writeCards(
  ctx: Ctx,
  itemId: string,
  cards: readonly CardInDoc[],
) {
  if (cards.length === 0) return;
  await ctx.db
    .insert(card)
    .values(cards.map((found) => ({ ...found, userId: ctx.userId, itemId })))
    .onConflictDoUpdate({
      target: [card.itemId, card.blockId],
      set: {
        position: sentValueOf(card.position),
        front: sentValueOf(card.front),
        back: sentValueOf(card.back),
        removedAt: null,
        updatedAt: ctx.now,
      },
      setWhere: sql`(${card.position}, ${card.front}, ${card.back}, ${card.removedAt}) is distinct from (${sentValueOf(card.position)}, ${sentValueOf(card.front)}, ${sentValueOf(card.back)}, null)`,
    });
}

function sentValueOf(column: PgColumn) {
  return sql.raw(`excluded."${column.name}"`);
}

function markMissingCardsRemoved(
  ctx: Ctx,
  itemId: string,
  cards: readonly CardInDoc[],
) {
  return ctx.db
    .update(card)
    .set({ removedAt: ctx.now, updatedAt: ctx.now })
    .where(
      and(
        liveCards(ctx),
        eq(card.itemId, itemId),
        notInArray(
          card.blockId,
          cards.map(({ blockId }) => blockId),
        ),
      ),
    );
}
