import 'server-only';

import type { Db } from '@/server/db/client';
import { findOrCreateSettings } from '@/server/settings';

import type { Ctx } from './load-ctx';

export async function ctxOf(db: Db, userId: string, now: Date): Promise<Ctx> {
  const settings = await findOrCreateSettings(db, { userId, locale: 'en' });
  return { userId, db, now, settings };
}
