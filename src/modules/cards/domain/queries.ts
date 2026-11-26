import 'server-only';

import { and, eq } from 'drizzle-orm';

import type { CardStatus } from '@/lib/card-statuses';
import type { Ctx } from '@/server/ctx/load-ctx';
import { card } from '@/server/db/schema/cards';

import { liveCards } from './live-cards';

export async function cardStatusesIn(
  ctx: Ctx,
  itemId: string,
): Promise<Record<string, CardStatus>> {
  const cards = await ctx.db
    .select({ blockId: card.blockId, status: card.status })
    .from(card)
    .where(and(liveCards(ctx), eq(card.itemId, itemId)));
  return Object.fromEntries(
    cards.map(({ blockId, status }) => [blockId, status]),
  );
}
