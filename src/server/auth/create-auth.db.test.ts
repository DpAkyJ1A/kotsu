import { symmetricDecrypt } from 'better-auth/crypto';
import { describe, expect } from 'vitest';

import {
  cookiesFrom,
  createTestAuth,
  EMAIL,
  enterCode,
  post,
  requestCode,
  signIn,
  TEST_SECRET,
} from '@/server/auth/testing';
import { verification } from '@/server/db/schema/auth';
import { dbTest as test } from '@/server/db/testing';

describe('the auth API', () => {
  test('a wrong code does not sign in', async ({ db }) => {
    const { auth } = createTestAuth(db);

    await requestCode(auth);
    const response = await enterCode(auth, '000000');

    expect(response.status).toBe(400);
    expect(cookiesFrom(response)).toBe('');
  });

  test('the database keeps the code encrypted with the secret', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);

    await requestCode(auth);
    const [row] = await db.select().from(verification);
    const [storedCode = ''] = row?.value.split(':') ?? [];

    expect(storedCode).not.toBe(sentCodes[0]);
    expect(await symmetricDecrypt({ key: TEST_SECRET, data: storedCode })).toBe(
      sentCodes[0],
    );
  });

  test('a fourth code request within a minute is refused', async ({ db }) => {
    const { auth } = createTestAuth(db);

    const statuses = [];
    for (let i = 0; i < 4; i++) statuses.push((await requestCode(auth)).status);

    expect(statuses).toEqual([200, 200, 200, 429]);
  });

  test('only sign-in codes are emailed', async ({ db }) => {
    const { auth, sentCodes } = createTestAuth(db);
    await signIn(auth, sentCodes);

    const response = await post(auth, {
      path: '/email-otp/send-verification-otp',
      body: { email: EMAIL, type: 'forget-password' },
    });

    expect(response.status).toBe(200);
    expect(sentCodes).toHaveLength(1);
  });

  test.for([
    '/email-otp/reset-password',
    '/email-otp/change-email',
    '/email-otp/verify-email',
  ])('a code cannot change the account through %s', async (path, { db }) => {
    const { auth } = createTestAuth(db);

    const response = await post(auth, {
      path,
      body: { email: EMAIL, otp: '000000' },
    });

    expect(response.status).toBe(404);
  });
});
