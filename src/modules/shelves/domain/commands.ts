import 'server-only';

import { and, eq, gt, ne } from 'drizzle-orm';
import { generateKeyBetween } from 'fractional-indexing';

import type { Ctx } from '@/server/ctx/load-ctx';
import { shelf } from '@/server/db/schema/shelves';
import { AppError, command } from '@/server/domain';

import { leastUsedColor } from '../core/least-used-color';
import {
  CreateShelfInput,
  DeleteShelfInput,
  MoveShelfInput,
  type Shelf,
  UpdateShelfInput,
} from '../core/shelf';
import { shelfDto } from './dto';

export const createShelf = command(
  CreateShelfInput,
  async (ctx, { id, name, color }): Promise<Shelf> => {
    const shelves = await ctx.db
      .select({ color: shelf.color, position: shelf.position })
      .from(shelf)
      .where(eq(shelf.userId, ctx.userId))
      .orderBy(shelf.position);
    const [created] = await ctx.db
      .insert(shelf)
      .values({
        id,
        userId: ctx.userId,
        name,
        color: color ?? leastUsedColor(shelves.map((other) => other.color)),
        position: generateKeyBetween(shelves.at(-1)?.position, null),
      })
      .returning(shelfDto);
    if (!created) throw new Error('The insert returned no shelf');
    return created;
  },
);

export const updateShelf = command(
  UpdateShelfInput,
  async (ctx, { id, ...patch }): Promise<Shelf> => {
    const [updated] = await ctx.db
      .update(shelf)
      .set(patch)
      .where(ownShelf(ctx, id))
      .returning(shelfDto);
    if (!updated) throw new AppError('NOT_FOUND');
    return updated;
  },
);

export const moveShelf = command(MoveShelfInput, async (ctx, { id, after }) => {
  const previous = after === undefined ? null : await positionOf(ctx, after);
  const next = await positionFollowing(ctx, previous, id);
  const [moved] = await ctx.db
    .update(shelf)
    .set({ position: generateKeyBetween(previous, next) })
    .where(ownShelf(ctx, id))
    .returning({ id: shelf.id });
  if (!moved) throw new AppError('NOT_FOUND');
});

export const deleteShelf = command(DeleteShelfInput, async (ctx, { id }) => {
  const [deleted] = await ctx.db
    .delete(shelf)
    .where(ownShelf(ctx, id))
    .returning({ id: shelf.id });
  if (!deleted) throw new AppError('NOT_FOUND');
});

function ownShelf(ctx: Ctx, id: string) {
  return and(eq(shelf.userId, ctx.userId), eq(shelf.id, id));
}

async function positionOf(ctx: Ctx, id: string) {
  const [found] = await ctx.db
    .select({ position: shelf.position })
    .from(shelf)
    .where(ownShelf(ctx, id));
  if (!found) throw new AppError('NOT_FOUND');
  return found.position;
}

async function positionFollowing(
  ctx: Ctx,
  previous: string | null,
  movingId: string,
) {
  const [following] = await ctx.db
    .select({ position: shelf.position })
    .from(shelf)
    .where(
      and(
        eq(shelf.userId, ctx.userId),
        ne(shelf.id, movingId),
        previous === null ? undefined : gt(shelf.position, previous),
      ),
    )
    .orderBy(shelf.position)
    .limit(1);
  return following?.position ?? null;
}
