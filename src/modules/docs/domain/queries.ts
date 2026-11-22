import 'server-only';

import type { JSONContent } from '@tiptap/core';
import { and, eq, sql } from 'drizzle-orm';

import { item } from '@/server/db/schema/shelves';
import { AppError, query } from '@/server/domain';

import { type Doc, GetDocInput } from '../core/doc';

export const getDoc = query(GetDocInput, async (ctx, { id }): Promise<Doc> => {
  const [doc] = await ctx.db
    .select({
      id: item.id,
      content: sql<JSONContent | null>`${item.content}`,
      version: item.version,
    })
    .from(item)
    .where(
      and(eq(item.userId, ctx.userId), eq(item.id, id), eq(item.kind, 'doc')),
    );
  if (!doc) throw new AppError('NOT_FOUND');
  return doc;
});
