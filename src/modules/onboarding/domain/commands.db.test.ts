import { eq } from 'drizzle-orm';
import { describe, expect, vi } from 'vitest';

import type * as shelvesApi from '@/modules/shelves/api';
import { createShelf } from '@/modules/shelves/api';
import { createUser } from '@/server/auth/testing';
import type { Ctx } from '@/server/ctx/load-ctx';
import { ctxOf } from '@/server/ctx/testing';
import type { Db } from '@/server/db/client';
import { userSettings } from '@/server/db/schema/settings';
import { shelf } from '@/server/db/schema/shelves';
import { dbTest as test } from '@/server/db/testing';

import { completeOnboarding } from './commands';

vi.mock(import('@/modules/shelves/api'), async (importOriginal) => {
  const original = await importOriginal();
  return { createShelf: vi.fn(original.createShelf) };
});

const NOW = new Date('2026-11-19T09:00:00Z');

async function signIn(db: Db, email: string) {
  return ctxOf(db, await createUser(db, email), NOW);
}

async function shelvesOf(ctx: Ctx) {
  return ctx.db
    .select({ name: shelf.name, color: shelf.color })
    .from(shelf)
    .where(eq(shelf.userId, ctx.userId))
    .orderBy(shelf.position);
}

async function shelfNames(ctx: Ctx) {
  return (await shelvesOf(ctx)).map(({ name }) => name);
}

async function settingsOf(ctx: Ctx) {
  const [settings] = await ctx.db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, ctx.userId));
  return settings;
}

describe('completeOnboarding', () => {
  test.for([
    ['language', ['Vocabulary', 'Grammar', 'Reading & listening', 'Speaking']],
    ['course', ['Lectures', 'Assignments', 'Exam prep']],
    ['jobSearch', ['Job search', 'Interview prep', 'English', 'Projects']],
    ['blank', []],
  ] as const)(
    'the %s template adds its shelves in order',
    async ([templateId, shelves], { db }) => {
      const ada = await signIn(db, 'ada@example.com');

      await completeOnboarding(ada, { templateId, timezone: 'UTC' });

      expect(await shelfNames(ada)).toEqual(shelves);
    },
  );

  test("records the browser's time zone and the time of onboarding", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');

    await completeOnboarding(ada, {
      templateId: 'blank',
      timezone: 'Europe/Madrid',
    });

    expect(await settingsOf(ada)).toMatchObject({
      timezone: 'Europe/Madrid',
      onboardedAt: NOW,
    });
  });

  test("names the shelves in the user's language", async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const inRussian: Ctx = {
      ...ada,
      settings: { ...ada.settings, locale: 'ru' },
    };

    await completeOnboarding(inRussian, {
      templateId: 'course',
      timezone: 'UTC',
    });

    expect(await shelfNames(ada)).toEqual([
      'Лекции',
      'Задания',
      'Подготовка к экзамену',
    ]);
  });

  test('colours the shelves in palette order, as the preview shows them', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');

    await completeOnboarding(ada, { templateId: 'jobSearch', timezone: 'UTC' });

    expect((await shelvesOf(ada)).map(({ color }) => color)).toEqual([
      'violet',
      'blue',
      'amber',
      'green',
    ]);
  });

  test("adds the template's shelves after the ones already there", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    await createShelf(ada, { name: 'Projects' });

    await completeOnboarding(ada, { templateId: 'jobSearch', timezone: 'UTC' });

    expect(await shelfNames(ada)).toEqual([
      'Projects',
      'Job search',
      'Interview prep',
      'English',
      'Projects',
    ]);
  });

  test('a shelf that fails undoes the whole onboarding', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const shelves = await vi.importActual<typeof shelvesApi>(
      '@/modules/shelves/api',
    );
    vi.mocked(createShelf)
      .mockImplementationOnce(shelves.createShelf)
      .mockRejectedValueOnce(new Error('The second shelf failed'));

    await expect(
      completeOnboarding(ada, { templateId: 'course', timezone: 'Asia/Tokyo' }),
    ).rejects.toThrow('The second shelf failed');

    expect(await shelfNames(ada)).toEqual([]);
    expect(await settingsOf(ada)).toMatchObject({
      timezone: 'UTC',
      onboardedAt: null,
    });
  });

  test('a second time adds nothing', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    await completeOnboarding(ada, { templateId: 'course', timezone: 'UTC' });

    await completeOnboarding(ada, { templateId: 'language', timezone: 'UTC' });

    expect(await shelfNames(ada)).toEqual([
      'Lectures',
      'Assignments',
      'Exam prep',
    ]);
  });

  test("adds to the signed-in user's shelves, never another user's", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bea = await signIn(db, 'bea@example.com');

    await completeOnboarding(bea, { templateId: 'course', timezone: 'UTC' });

    expect(await shelfNames(ada)).toEqual([]);
  });
});
