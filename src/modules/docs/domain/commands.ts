import 'server-only';

import { and, eq, sql } from 'drizzle-orm';

import { syncCards } from '@/modules/cards/api';
import { hasRoomForBody } from '@/modules/shelves/api';
import type { Ctx } from '@/server/ctx/load-ctx';
import { item } from '@/server/db/schema/shelves';
import { AppError, command } from '@/server/domain';

import { byteLengthOf } from '../core/byte-length';
import { cardsInDoc } from '../core/cards-in-doc';
import { type DocSave, type SavedDoc, SaveDocInput } from '../core/doc';
import { plainTextOf } from '../core/plain-text';
import { LARGEST_DOC_BYTES } from '../core/save-limits';
import { ownDoc } from './own-doc';

const PROGRAM_LIMIT_EXCEEDED = '54000';

export const saveDoc = command.tx(
  SaveDocInput,
  async (ctx, save): Promise<SavedDoc> => {
    const sizeBytes = byteLengthOf(JSON.stringify(save.content));
    if (sizeBytes > LARGEST_DOC_BYTES) throw new AppError('LIMIT');
    const cards = cardsInDoc(save.content);
    if (!cards) throw new AppError('VALIDATION');
    const saved = await writeBody(ctx, save, sizeBytes);
    if (!saved) throw new AppError(await refusalOf(ctx, save));
    await syncCards(ctx, save.id, cards);
    return saved;
  },
);

async function writeBody(
  ctx: Ctx,
  { id, version, content }: DocSave,
  sizeBytes: number,
) {
  try {
    const [saved] = await ctx.db
      .update(item)
      .set({
        content,
        plainText: plainTextOf(content),
        sizeBytes,
        version: sql`${item.version} + 1`,
      })
      .where(
        and(
          ownDoc(ctx, id),
          eq(item.version, version),
          hasRoomForBody(ctx, sizeBytes),
        ),
      )
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

async function refusalOf(ctx: Ctx, { id, version }: DocSave) {
  const [found] = await ctx.db
    .select({ version: item.version })
    .from(item)
    .where(ownDoc(ctx, id));
  if (!found) return 'NOT_FOUND';
  return found.version === version ? 'STORAGE_FULL' : 'CONFLICT';
}
