import { describe, expect } from 'vitest';

import type { Auth } from '@/server/auth/create-auth';
import {
  ANOTHER_EMAIL,
  cookiesFrom,
  createTestAuth,
  EMAIL,
  enterCode,
  requestCode,
  signIn,
} from '@/server/auth/testing';
import type { Db } from '@/server/db/client';
import { signInCodeCount, verification } from '@/server/db/schema/auth';
import { dbTest as test } from '@/server/db/testing';

const MINUTE_MS = 60 * 1000;

async function requestCodesFromNewIps(auth: Auth, emails: string[]) {
  const statuses = [];
  for (const [i, email] of emails.entries()) {
    const ip = `203.0.113.${String(i + 1)}`;
    const response = await requestCode(auth, { email, ip });
    statuses.push(response.status);
  }
  return statuses;
}

async function startWindow(db: Db, minutesAgo: number) {
  await db
    .update(signInCodeCount)
    .set({ windowStartedAt: new Date(Date.now() - minutesAgo * MINUTE_MS) });
}

describe('sign-in codes for one email address', () => {
  test('the fourth code to one address within 15 minutes is refused, whatever the IP', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    await requestCodesFromNewIps(auth, [EMAIL, EMAIL, EMAIL]);

    const response = await requestCode(auth, { ip: '198.51.100.1' });

    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ code: 'TOO_MANY_CODES' });
    expect(sentCodes).toHaveLength(3);
  });

  test('a refused request leaves the last code working', async ({ db }) => {
    const { auth, sentCodes } = createTestAuth(db);
    await requestCodesFromNewIps(auth, [EMAIL, EMAIL, EMAIL, EMAIL]);

    const response = await enterCode(auth, sentCodes.at(-1));

    expect(cookiesFrom(response)).toContain('session_token');
  });

  test('an address counts the same in any letter case', async ({ db }) => {
    const { auth } = createTestAuth(db);

    const statuses = await requestCodesFromNewIps(auth, [
      EMAIL.toUpperCase(),
      EMAIL.replace('ada', 'Ada'),
      EMAIL,
      EMAIL.toUpperCase(),
    ]);

    expect(statuses).toEqual([200, 200, 200, 429]);
  });

  test('another address still gets its code', async ({ db }) => {
    const { auth } = createTestAuth(db);

    const statuses = await requestCodesFromNewIps(auth, [
      EMAIL,
      EMAIL,
      EMAIL,
      ANOTHER_EMAIL,
    ]);

    expect(statuses).toEqual([200, 200, 200, 200]);
  });

  test('a request the IP limit refuses does not count for the address', async ({
    db,
  }) => {
    const { auth } = createTestAuth(db);
    const ip = '198.51.100.1';
    for (let i = 0; i < 3; i++)
      await requestCode(auth, { email: ANOTHER_EMAIL, ip });
    await requestCode(auth, { ip });

    const statuses = await requestCodesFromNewIps(auth, [EMAIL, EMAIL, EMAIL]);

    expect(statuses).toEqual([200, 200, 200]);
  });

  test('a request without a valid address leaves no count', async ({ db }) => {
    const { auth } = createTestAuth(db);

    const response = await requestCode(auth, { email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(await db.select().from(signInCodeCount)).toEqual([]);
  });

  test('codes sent 14 minutes ago still count', async ({ db }) => {
    const { auth } = createTestAuth(db);
    await requestCodesFromNewIps(auth, [EMAIL, EMAIL, EMAIL]);
    await startWindow(db, 14);

    const response = await requestCode(auth, { ip: '198.51.100.1' });

    expect(response.status).toBe(429);
  });

  test('15 minutes after the first code the address gets three more', async ({
    db,
  }) => {
    const { auth } = createTestAuth(db);
    await requestCodesFromNewIps(auth, [EMAIL, EMAIL, EMAIL]);
    await startWindow(db, 15);

    const statuses = await requestCodesFromNewIps(auth, [
      EMAIL,
      EMAIL,
      EMAIL,
      EMAIL,
    ]);

    expect(statuses).toEqual([200, 200, 200, 429]);
  });

  test.for(['forget-password', 'email-verification', 'change-email'])(
    'a %s code is refused and leaves no row behind',
    async (type, { db }) => {
      const { auth, sentCodes } = createTestAuth(db);
      await signIn(auth, sentCodes);

      const response = await requestCode(auth, { type });

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        code: 'SIGN_IN_CODES_ONLY',
      });
      expect(sentCodes).toHaveLength(1);
      expect(await db.select().from(verification)).toEqual([]);
    },
  );
});
