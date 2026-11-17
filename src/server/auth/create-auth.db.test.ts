import { symmetricDecrypt } from 'better-auth/crypto';
import { describe, expect } from 'vitest';

import {
  cookiesFrom,
  createPasskey,
  createTestAuth,
  createUser,
  EMAIL,
  enterCode,
  HOST,
  post,
  requestCode,
  RP_ID,
  signIn,
  TEST_SECRET,
} from '@/server/auth/testing';
import { verification } from '@/server/db/schema/auth';
import { dbTest as test } from '@/server/db/testing';

const ANOTHER_IP = '203.0.113.7';

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

  test('three wrong codes lock the code, so even the right one fails', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    await requestCode(auth);

    for (let i = 0; i < 3; i++) await enterCode(auth, '000000');
    const response = await post(auth, {
      path: '/sign-in/email-otp',
      body: { email: EMAIL, otp: sentCodes[0] },
      ip: ANOTHER_IP,
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'TOO_MANY_ATTEMPTS' });
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

describe('passkeys', () => {
  test('a visitor cannot start adding a passkey', async ({ db }) => {
    const { auth } = createTestAuth(db);

    const adding = auth.api.generatePasskeyRegistrationOptions({
      headers: new Headers({ host: HOST }),
    });

    await expect(adding).rejects.toMatchObject({ statusCode: 401 });
  });

  test('a new passkey belongs to Kotsu on this host', async ({ db }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signIn(auth, sentCodes);

    const options = await auth.api.generatePasskeyRegistrationOptions({
      headers: new Headers({ host: HOST, cookie }),
    });

    expect(options.rp).toEqual({ id: RP_ID, name: 'Kotsu' });
  });

  test("the device is told only about the user's own passkeys", async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signIn(auth, sentCodes);
    const headers = new Headers({ host: HOST, cookie });
    const session = await auth.api.getSession({ headers });
    const own = await createPasskey(db, session?.user.id ?? '');
    await createPasskey(db, await createUser(db, 'bea@example.com'));

    const options = await auth.api.generatePasskeyRegistrationOptions({
      headers,
    });

    expect(options.excludeCredentials?.map(({ id }) => id)).toEqual([
      own.credentialID,
    ]);
  });

  test.for(['/passkey/update-passkey', '/passkey/delete-passkey'])(
    'a passkey cannot be changed through %s until settings have it',
    async (path, { db }) => {
      const { auth, sentCodes } = createTestAuth(db);
      const cookie = await signIn(auth, sentCodes);
      const session = await auth.api.getSession({
        headers: new Headers({ host: HOST, cookie }),
      });
      const { id } = await createPasskey(db, session?.user.id ?? '');

      const response = await post(auth, {
        path,
        body: { id, name: 'Work laptop' },
        cookie,
      });

      expect(response.status).toBe(404);
    },
  );
});
