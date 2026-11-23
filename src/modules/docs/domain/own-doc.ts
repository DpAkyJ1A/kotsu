import 'server-only';

import { and, eq } from 'drizzle-orm';

import type { Ctx } from '@/server/ctx/load-ctx';
import { item } from '@/server/db/schema/shelves';

export function ownDoc(ctx: Ctx, id: string) {
  return and(
    eq(item.userId, ctx.userId),
    eq(item.id, id),
    eq(item.kind, 'doc'),
  );
}
