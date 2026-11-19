import { describe, expect } from 'vitest';

import { createGoogleAccount, createUser } from '@/server/auth/testing';
import { ctxOf } from '@/server/ctx/testing';
import { account } from '@/server/db/schema/auth';
import { dbTest as test } from '@/server/db/testing';

import { findAccount, findGoogleLink } from './queries';

const NOW = new Date('2026-11-17T09:00:00Z');

describe('findAccount', () => {
  test("gives the signed-in user's name and email, not another user's", async ({
    db,
  }) => {
    await createUser(db, 'ada@example.com');
    const bea = await createUser(db, 'bea@example.com');

    const account = await findAccount(await ctxOf(db, bea, NOW));

    expect(account).toEqual({
      name: 'bea@example.com',
      email: 'bea@example.com',
    });
  });
});

describe('findGoogleLink', () => {
  test("finds the signed-in user's Google account, not another user's or another provider's", async ({
    db,
  }) => {
    const ada = await createUser(db, 'ada@example.com');
    const bea = await createUser(db, 'bea@example.com');
    const adasGoogle = await createGoogleAccount(db, ada);
    await db.insert(account).values({
      userId: bea,
      providerId: 'github',
      accountId: 'bea-on-github',
    });

    expect(await findGoogleLink(await ctxOf(db, ada, NOW))).toEqual({
      status: 'connected',
      accountIds: [adasGoogle],
    });
    expect(await findGoogleLink(await ctxOf(db, bea, NOW))).toEqual({
      status: 'notConnected',
    });
  });

  test('lists every Google account of the user, oldest first, so Disconnect can remove them all', async ({
    db,
  }) => {
    const ada = await createUser(db, 'ada@example.com');
    const first = await createGoogleAccount(db, ada);
    const second = await createGoogleAccount(db, ada);

    expect(await findGoogleLink(await ctxOf(db, ada, NOW))).toEqual({
      status: 'connected',
      accountIds: [first, second],
    });
  });
});
