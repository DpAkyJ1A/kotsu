import 'server-only';

import { eq } from 'drizzle-orm';

import type { Db } from '@/server/db/client';
import { userSettings } from '@/server/db/schema/settings';

export type UserSettings = typeof userSettings.$inferSelect;

type NewSettings = Pick<typeof userSettings.$inferInsert, 'userId' | 'locale'>;

export async function findOrCreateSettings(db: Db, newSettings: NewSettings) {
  return (
    (await findSettings(db, newSettings.userId)) ??
    (await createSettings(db, newSettings))
  );
}

async function findSettings(db: Db, userId: string) {
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  return settings;
}

async function createSettings(db: Db, newSettings: NewSettings) {
  await db.insert(userSettings).values(newSettings).onConflictDoNothing();
  const settings = await findSettings(db, newSettings.userId);
  if (!settings) throw new Error(`No settings for user ${newSettings.userId}`);
  return settings;
}
