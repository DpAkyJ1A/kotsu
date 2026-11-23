import 'server-only';

import { and, eq, gt, max, min, ne, sql } from 'drizzle-orm';
import { generateKeyBetween } from 'fractional-indexing';

import type { Ctx } from '@/server/ctx/load-ctx';
import { item, shelf } from '@/server/db/schema/shelves';
import { AppError, command } from '@/server/domain';
import { storageQuotaOf } from '@/server/storage-quota';

import {
  CreateItemInput,
  DeleteItemInput,
  type Item,
  MoveItemInput,
  RenameItemInput,
} from '../core/item';
import { fitsInQuota, ITEM_ROW_BYTES } from '../core/storage';
import { itemDto } from './dto';
import { usedBytes } from './storage';

export const createItem = command(
  CreateItemInput,
  async (ctx, { id, shelfId, kind, title }): Promise<Item> => {
    const { last, used } = await placeOn(ctx, shelfId);
    if (!fitsInQuota(used + ITEM_ROW_BYTES, storageQuotaOf(ctx.settings))) {
      throw new AppError('STORAGE_FULL');
    }
    const [created] = await ctx.db
      .insert(item)
      .values({
        id,
        userId: ctx.userId,
        shelfId,
        kind,
        title,
        position: generateKeyBetween(last, null),
      })
      .returning(itemDto);
    if (!created) throw new Error('The insert returned no item');
    return created;
  },
);

export const renameItem = command(
  RenameItemInput,
  async (ctx, { id, title }): Promise<Item> => {
    const [renamed] = await ctx.db
      .update(item)
      .set({ title })
      .where(ownItem(ctx, id))
      .returning(itemDto);
    if (!renamed) throw new AppError('NOT_FOUND');
    return renamed;
  },
);

export const moveItem = command(
  MoveItemInput,
  async (ctx, { id, shelfId, after }) => {
    const previous =
      after === undefined ? null : await positionOn(ctx, shelfId, after);
    const next = await positionFollowing(ctx, shelfId, previous, id);
    const [moved] = await ctx.db
      .update(item)
      .set({ shelfId, position: generateKeyBetween(previous, next) })
      .where(ownItem(ctx, id))
      .returning({ id: item.id });
    if (!moved) throw new AppError('NOT_FOUND');
  },
);

export const deleteItem = command(DeleteItemInput, async (ctx, { id }) => {
  const [deleted] = await ctx.db
    .delete(item)
    .where(ownItem(ctx, id))
    .returning({ id: item.id });
  if (!deleted) throw new AppError('NOT_FOUND');
});

function ownItem(ctx: Ctx, id: string) {
  return and(eq(item.userId, ctx.userId), eq(item.id, id));
}

function ownShelf(ctx: Ctx, id: string) {
  return and(eq(shelf.userId, ctx.userId), eq(shelf.id, id));
}

async function placeOn(ctx: Ctx, shelfId: string) {
  const [found] = await ctx.db
    .select({
      last: max(item.position),
      used: sql`(${usedBytes(ctx)})`.mapWith(Number),
    })
    .from(shelf)
    .leftJoin(item, eq(item.shelfId, shelf.id))
    .where(ownShelf(ctx, shelfId))
    .groupBy(shelf.id);
  if (!found) throw new AppError('NOT_FOUND');
  return found;
}

async function positionOn(ctx: Ctx, shelfId: string, id: string) {
  const [found] = await ctx.db
    .select({ position: item.position })
    .from(item)
    .where(and(ownItem(ctx, id), eq(item.shelfId, shelfId)));
  if (!found) throw new AppError('NOT_FOUND');
  return found.position;
}

async function positionFollowing(
  ctx: Ctx,
  shelfId: string,
  previous: string | null,
  movingId: string,
) {
  const [found] = await ctx.db
    .select({ next: min(item.position) })
    .from(shelf)
    .leftJoin(
      item,
      and(
        eq(item.shelfId, shelf.id),
        ne(item.id, movingId),
        previous === null ? undefined : gt(item.position, previous),
      ),
    )
    .where(ownShelf(ctx, shelfId))
    .groupBy(shelf.id);
  if (!found) throw new AppError('NOT_FOUND');
  return found.next;
}
