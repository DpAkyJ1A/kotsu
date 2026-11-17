import 'server-only';

import type { Locale } from 'next-intl';

import type { Auth } from '@/server/auth/create-auth';
import type { Db } from '@/server/db/client';
import { findOrCreateSettings, type UserSettings } from '@/server/settings';

export type Ctx = {
  userId: string;
  db: Db;
  now: Date;
  settings: UserSettings;
};

type LoadCtxInput = {
  auth: Auth;
  db: Db;
  headers: Headers;
  locale: Locale;
  now: Date;
};

export async function loadCtx({
  auth,
  db,
  headers,
  locale,
  now,
}: LoadCtxInput): Promise<Ctx | null> {
  const session = await auth.api.getSession({
    headers,
    query: { disableRefresh: true },
  });
  if (!session) return null;

  const userId = session.user.id;
  const settings = await findOrCreateSettings(db, { userId, locale });
  return { userId, db, now, settings };
}
