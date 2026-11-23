import 'server-only';

import { eq } from 'drizzle-orm';

import type { Db } from '@/server/db/client';
import { userSettings } from '@/server/db/schema/settings';
import { findOrCreateSettings } from '@/server/settings';

import type { Ctx } from './load-ctx';

export async function ctxOf(db: Db, userId: string, now: Date): Promise<Ctx> {
  const settings = await findOrCreateSettings(db, { userId, locale: 'en' });
  return { userId, db, now, settings };
}

export async function withStorageQuota(ctx: Ctx, storageQuotaBytes: number) {
  await ctx.db
    .update(userSettings)
    .set({ storageQuotaBytes })
    .where(eq(userSettings.userId, ctx.userId));
  return ctxOf(ctx.db, ctx.userId, ctx.now);
}
