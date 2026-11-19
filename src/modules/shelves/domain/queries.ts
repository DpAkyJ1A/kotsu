import 'server-only';

import { eq } from 'drizzle-orm';

import type { Ctx } from '@/server/ctx/load-ctx';
import { shelf } from '@/server/db/schema/shelves';

import type { Shelf } from '../core/shelf';
import { shelfDto } from './dto';

export async function listShelves(ctx: Ctx): Promise<Shelf[]> {
  return ctx.db
    .select(shelfDto)
    .from(shelf)
    .where(eq(shelf.userId, ctx.userId))
    .orderBy(shelf.position, shelf.id);
}
