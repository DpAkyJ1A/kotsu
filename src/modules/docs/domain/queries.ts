import 'server-only';

import type { JSONContent } from '@tiptap/core';
import { sql } from 'drizzle-orm';

import { item } from '@/server/db/schema/shelves';
import { AppError, query } from '@/server/domain';

import { type Doc, GetDocInput } from '../core/doc';
import { ownDoc } from './own-doc';

export const getDoc = query(GetDocInput, async (ctx, { id }): Promise<Doc> => {
  const [doc] = await ctx.db
    .select({
      id: item.id,
      content: sql<JSONContent | null>`${item.content}`,
      version: item.version,
      sizeBytes: item.sizeBytes,
    })
    .from(item)
    .where(ownDoc(ctx, id));
  if (!doc) throw new AppError('NOT_FOUND');
  return doc;
});
