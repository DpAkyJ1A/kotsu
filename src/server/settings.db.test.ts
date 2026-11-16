import { describe, expect } from 'vitest';

import type { Db } from '@/server/db/client';
import { user } from '@/server/db/schema/auth';
import { userSettings } from '@/server/db/schema/settings';
import { dbTest as test } from '@/server/db/testing';
import { findOrCreateSettings } from '@/server/settings';

async function createUser(db: Db, email: string) {
  const id = crypto.randomUUID();
  await db.insert(user).values({ id, name: email, email });
  return id;
}

describe('findOrCreateSettings', () => {
  test('two first visits at once share one row instead of failing on its key', async ({
    db,
  }) => {
    const userId = await createUser(db, 'ada@example.com');

    const [first, second] = await Promise.all([
      findOrCreateSettings(db, { userId, locale: 'ru' }),
      findOrCreateSettings(db, { userId, locale: 'en' }),
    ]);

    expect(second).toEqual(first);
    expect(await db.select().from(userSettings)).toHaveLength(1);
  });

  test("a second user gets their own settings, not the first user's", async ({
    db,
  }) => {
    const ada = await createUser(db, 'ada@example.com');
    const bea = await createUser(db, 'bea@example.com');

    await findOrCreateSettings(db, { userId: ada, locale: 'ru' });
    const beasSettings = await findOrCreateSettings(db, {
      userId: bea,
      locale: 'en',
    });

    expect(beasSettings).toMatchObject({ userId: bea, locale: 'en' });
  });
});
