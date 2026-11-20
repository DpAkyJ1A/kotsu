import 'server-only';

import { eq } from 'drizzle-orm';

import type { Ctx } from '@/server/ctx/load-ctx';
import { item, shelf } from '@/server/db/schema/shelves';

import type { Item } from '../core/item';
import type { Shelf } from '../core/shelf';
import { itemDto, shelfDto } from './dto';

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
