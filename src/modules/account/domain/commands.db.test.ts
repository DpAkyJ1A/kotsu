import { eq } from 'drizzle-orm';
import { describe, expect } from 'vitest';

import { createUser } from '@/server/auth/testing';
import { ctxOf } from '@/server/ctx/testing';
import type { Db } from '@/server/db/client';
import { userSettings } from '@/server/db/schema/settings';
import { dbTest as test } from '@/server/db/testing';
import { AppError } from '@/server/domain';

import { updateSettings } from './commands';

const NOW = new Date('2026-11-18T09:00:00Z');

async function savedSettings(db: Db, userId: string) {
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  return settings;
}

describe('updateSettings', () => {
  test('changes only what the patch names and returns all the settings', async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);

    const settings = await updateSettings(ada, {
      theme: 'dark',
      dayEndsAt: '05:00',
    });

    expect(settings).toEqual({
      theme: 'dark',
      locale: 'en',
      dayEndsAt: '05:00',
      weekStart: 'monday',
      timeFormat: 'h24',
    });
    expect(await savedSettings(db, ada.userId)).toMatchObject({
      theme: 'dark',
      dayEndsAt: '05:00:00',
      timezone: 'UTC',
    });
  });

  test("changes the signed-in user's settings, never another user's", async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const bea = await ctxOf(db, await createUser(db, 'bea@example.com'), NOW);

    await updateSettings(bea, { locale: 'ru', weekStart: 'sunday' });

    expect(await savedSettings(db, ada.userId)).toMatchObject({
      locale: 'en',
      weekStart: 'monday',
    });
  });

  test('refuses a patch with nothing to change and saves nothing', async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);

    const failure = updateSettings(ada, {});

    await expect(failure).rejects.toThrow(AppError);
    await expect(failure).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(await savedSettings(db, ada.userId)).toEqual(ada.settings);
  });
});
