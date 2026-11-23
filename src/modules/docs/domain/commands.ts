import 'server-only';

import { and, eq, sql } from 'drizzle-orm';

import type { Ctx } from '@/server/ctx/load-ctx';
import { item } from '@/server/db/schema/shelves';
import { AppError, command } from '@/server/domain';

import { byteLengthOf } from '../core/byte-length';
import { type DocSave, type SavedDoc, SaveDocInput } from '../core/doc';
import { plainTextOf } from '../core/plain-text';
import { ownDoc } from './own-doc';

const PROGRAM_LIMIT_EXCEEDED = '54000';

export const saveDoc = command(
  SaveDocInput,
  async (ctx, save): Promise<SavedDoc> => {
    const saved = await writeBody(ctx, save);
    if (saved) return saved;
    throw new AppError((await exists(ctx, save.id)) ? 'CONFLICT' : 'NOT_FOUND');
  },
);

async function writeBody(ctx: Ctx, { id, version, content }: DocSave) {
  try {
    const [saved] = await ctx.db
      .update(item)
      .set({
        content,
        plainText: plainTextOf(content),
        sizeBytes: byteLengthOf(JSON.stringify(content)),
        version: sql`${item.version} + 1`,
      })
      .where(and(ownDoc(ctx, id), eq(item.version, version)))
      .returning({ version: item.version });
    return saved;
  } catch (error) {
    if (isOverAPostgresLimit(error))
      throw new AppError('LIMIT', { cause: error });
    throw error;
  }
}

function isOverAPostgresLimit(error: unknown) {
  return (
    error instanceof Error &&
    error.cause instanceof Error &&
    'code' in error.cause &&
    error.cause.code === PROGRAM_LIMIT_EXCEEDED
  );
}

async function exists(ctx: Ctx, id: string) {
  const [found] = await ctx.db
    .select({ id: item.id })
    .from(item)
    .where(ownDoc(ctx, id));
  return found !== undefined;
}
