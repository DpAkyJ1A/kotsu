import 'server-only';

import { and, count, desc, eq, sql } from 'drizzle-orm';

import { liveCards } from '@/modules/cards/api';
import type { Ctx } from '@/server/ctx/load-ctx';
import { card } from '@/server/db/schema/cards';
import { item, shelf } from '@/server/db/schema/shelves';
import { AppError, query } from '@/server/domain';
import { storageQuotaOf } from '@/server/storage-quota';

import type { Item } from '../core/item';
import { GetShelfInput, type Shelf, type ShelfContents } from '../core/shelf';
import { ITEM_ROW_BYTES, LARGEST_LISTED, type Storage } from '../core/storage';
import { itemDto, shelfDto } from './dto';
import { bytesOf, usedBytes } from './storage';

export async function getNavigation(
  ctx: Ctx,
): Promise<{ shelves: Shelf[]; items: Item[] }> {
  const [shelves, items] = await Promise.all([
    ctx.db
      .select(shelfDto)
      .from(shelf)
      .where(eq(shelf.userId, ctx.userId))
      .orderBy(shelf.position, shelf.id),
    ctx.db
      .select(itemDto)
      .from(item)
      .where(eq(item.userId, ctx.userId))
      .orderBy(item.shelfId, item.position, item.id),
  ]);
  return { shelves, items };
}

export const getShelf = query(
  GetShelfInput,
  async (ctx, { id }): Promise<ShelfContents> => {
    const [[found], counts] = await Promise.all([
      ctx.db
        .select({ id: shelf.id })
        .from(shelf)
        .where(and(eq(shelf.id, id), eq(shelf.userId, ctx.userId))),
      cardCountsOn(ctx, id),
    ]);
    if (!found) throw new AppError('NOT_FOUND');
    return {
      cardCounts: Object.fromEntries(
        counts.map(({ itemId, ...docCounts }) => [itemId, docCounts]),
      ),
    };
  },
);

function cardCountsOn(ctx: Ctx, shelfId: string) {
  return ctx.db
    .select({
      itemId: item.id,
      cards: count(),
      toReview:
        sql<number>`count(*) filter (where ${card.status} = 'review')`.mapWith(
          Number,
        ),
    })
    .from(item)
    .innerJoin(card, and(eq(card.itemId, item.id), liveCards(ctx)))
    .where(and(eq(item.userId, ctx.userId), eq(item.shelfId, shelfId)))
    .groupBy(item.id);
}

export async function getStorage(ctx: Ctx): Promise<Storage> {
  const [[used], shelves, docs] = await Promise.all([
    usedBytes(ctx),
    largestShelves(ctx),
    largestDocs(ctx),
  ]);
  return {
    usedBytes: used?.bytes ?? 0,
    quotaBytes: storageQuotaOf(ctx.settings),
    shelves,
    docs,
  };
}

function largestShelves(ctx: Ctx) {
  const bytes = bytesOf(item);
  return ctx.db
    .select({ ...shelfDto, bytes })
    .from(shelf)
    .innerJoin(item, eq(item.shelfId, shelf.id))
    .where(eq(shelf.userId, ctx.userId))
    .groupBy(shelf.id)
    .orderBy(desc(bytes), shelf.position, shelf.id)
    .limit(LARGEST_LISTED);
}

function largestDocs(ctx: Ctx) {
  return ctx.db
    .select({
      id: item.id,
      title: item.title,
      color: shelf.color,
      bytes: sql<number>`${item.sizeBytes} + ${ITEM_ROW_BYTES}`.mapWith(Number),
    })
    .from(item)
    .innerJoin(shelf, eq(shelf.id, item.shelfId))
    .where(and(eq(item.userId, ctx.userId), eq(item.kind, 'doc')))
    .orderBy(desc(item.sizeBytes), item.id)
    .limit(LARGEST_LISTED);
}
