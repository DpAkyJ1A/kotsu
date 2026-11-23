import 'server-only';

import { eq, gte, lte, or, sql } from 'drizzle-orm';
import { alias, type AnyPgColumn } from 'drizzle-orm/pg-core';

import type { Ctx } from '@/server/ctx/load-ctx';
import { item } from '@/server/db/schema/shelves';
import { storageQuotaOf } from '@/server/storage-quota';

import { ITEM_ROW_BYTES } from '../core/storage';

const counted = alias(item, 'counted_item');

type CountedItems = { id: AnyPgColumn; sizeBytes: AnyPgColumn };

export function bytesOf(items: CountedItems) {
  return sql<number>`coalesce(sum(${items.sizeBytes}), 0) + count(${items.id}) * ${ITEM_ROW_BYTES}`.mapWith(
    Number,
  );
}

export function usedBytes(ctx: Ctx) {
  return ctx.db
    .select({ bytes: bytesOf(counted) })
    .from(counted)
    .where(eq(counted.userId, ctx.userId));
}

export function hasRoomForBody(ctx: Ctx, sizeBytes: number) {
  const quotaBytes = storageQuotaOf(ctx.settings);
  if (quotaBytes === null) return undefined;
  return or(
    gte(item.sizeBytes, sizeBytes),
    lte(
      sql`(${usedBytes(ctx)}) - ${item.sizeBytes} + ${sizeBytes}`,
      quotaBytes,
    ),
  );
}
