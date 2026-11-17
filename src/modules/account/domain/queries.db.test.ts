import { describe, expect } from 'vitest';

import { createUser } from '@/server/auth/testing';
import type { Ctx } from '@/server/ctx/load-ctx';
import type { Db } from '@/server/db/client';
import { dbTest as test } from '@/server/db/testing';
import { findOrCreateSettings } from '@/server/settings';

import { findAccount } from './queries';

const NOW = new Date('2026-11-17T09:00:00Z');

async function ctxOf(db: Db, userId: string): Promise<Ctx> {
  const settings = await findOrCreateSettings(db, { userId, locale: 'en' });
  return { userId, db, now: NOW, settings };
}

describe('findAccount', () => {
  test("gives the signed-in user's name and email, not another user's", async ({
    db,
  }) => {
    await createUser(db, 'ada@example.com');
    const bea = await createUser(db, 'bea@example.com');

    const account = await findAccount(await ctxOf(db, bea));

    expect(account).toEqual({
      name: 'bea@example.com',
      email: 'bea@example.com',
    });
  });
});
