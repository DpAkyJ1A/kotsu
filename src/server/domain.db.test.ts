import { eq } from 'drizzle-orm';
import { describe, expect, vi } from 'vitest';
import { z } from 'zod';

import { createUser } from '@/server/auth/testing';
import { ctxOf } from '@/server/ctx/testing';
import type { Db } from '@/server/db/client';
import { userSettings } from '@/server/db/schema/settings';
import { dbTest as test } from '@/server/db/testing';

import { command, query } from './domain';

const NOW = new Date('2026-11-19T09:00:00Z');
const SOME_ID = '019a9c3e-0001-7000-8000-000000000001';

async function themeOf(db: Db, userId: string) {
  const [settings] = await db
    .select({ theme: userSettings.theme })
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  return settings?.theme;
}

describe('query', () => {
  const ById = z.strictObject({ id: z.uuid() });

  test('runs with the input its schema parsed', async ({ db }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const read = vi.fn(() => Promise.resolve('read'));

    expect(await query(ById, read)(ada, { id: SOME_ID })).toBe('read');
    expect(read).toHaveBeenCalledWith(ada, { id: SOME_ID });
  });

  test('answers VALIDATION without running when the input is wrong', async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const read = vi.fn(() => Promise.resolve('read'));

    await expect(
      query(ById, read)(ada, { id: 'not-a-uuid' }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(read).not.toHaveBeenCalled();
  });
});

describe('command.tx', () => {
  test('keeps every write when the run succeeds', async ({ db }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const setTheme = command.tx(z.strictObject({}), async (ctx) => {
      await ctx.db
        .update(userSettings)
        .set({ theme: 'dark' })
        .where(eq(userSettings.userId, ctx.userId));
    });

    await setTheme(ada, {});

    expect(await themeOf(ada.db, ada.userId)).toBe('dark');
  });

  test('undoes every write when the run fails', async ({ db }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const failAfterWrite = command.tx(z.strictObject({}), async (ctx) => {
      await ctx.db
        .update(userSettings)
        .set({ theme: 'dark' })
        .where(eq(userSettings.userId, ctx.userId));
      throw new Error('The second write failed');
    });

    await expect(failAfterWrite(ada, {})).rejects.toThrow(
      'The second write failed',
    );
    expect(await themeOf(ada.db, ada.userId)).toBe('system');
  });
});
