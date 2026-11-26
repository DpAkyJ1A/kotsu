import 'server-only';

import { and, eq, isNull } from 'drizzle-orm';

import type { Ctx } from '@/server/ctx/load-ctx';
import { card } from '@/server/db/schema/cards';

export function liveCards(ctx: Ctx) {
  return and(eq(card.userId, ctx.userId), isNull(card.removedAt));
}
