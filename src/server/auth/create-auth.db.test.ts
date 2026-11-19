import { symmetricDecrypt } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { describe, expect } from 'vitest';

import type { Auth } from '@/server/auth/create-auth';
import {
  ANOTHER_EMAIL,
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
import { passkey, session, verification } from '@/server/db/schema/auth';
import { dbTest as test } from '@/server/db/testing';

const ANOTHER_IP = '203.0.113.7';
const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY_MS);
}

async function userIdOf(auth: Auth, headers: Headers) {
  const current = await auth.api.getSession({ headers });
  return current?.user.id ?? '';
}

describe('the auth API', () => {
  test.for([
    'kotsu.devazx.com',
    'usekotsu.vercel.app',
    'kotsu-git-fix-auth-dpakyj1as-projects.vercel.app',
  ])("answers on Kotsu's host %s", async (host, { db }) => {
    const { auth } = createTestAuth(db);

    const session = auth.api.getSession({ headers: new Headers({ host }) });

    await expect(session).resolves.toBeNull();
  });

  test("refuses a host that is not Kotsu's", async ({ db }) => {
    const { auth } = createTestAuth(db);

    const session = auth.api.getSession({
      headers: new Headers({ host: 'kotsu.evil.example' }),
    });

    await expect(session).rejects.toThrow('not in the allowed hosts list');
  });

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

describe('a self-hosted copy', () => {
  const SELF_HOSTED = { APP_URL: 'https://kotsu.example.com' };

  function requestCodeFrom(origin: string, auth: Auth) {
    return post(auth, {
      path: '/email-otp/send-verification-otp',
      body: { email: EMAIL, type: 'sign-in' },
      origin,
    });
  }

  test('sends a code to its own address', async ({ db }) => {
    const { auth, sentCodes } = createTestAuth(db, SELF_HOSTED);

    const response = await requestCodeFrom('https://kotsu.example.com', auth);

    expect(response.status).toBe(200);
    expect(sentCodes).toHaveLength(1);
  });

  test.for(['http://localhost:5687', 'https://kotsu.evil.example'])(
    'refuses to send a code to %s',
    async (origin, { db }) => {
      const { auth, sentCodes } = createTestAuth(db, SELF_HOSTED);

      const response = await requestCodeFrom(origin, auth);

      expect(response.status).toBe(403);
      expect(sentCodes).toHaveLength(0);
    },
  );

  test('behind a trusted proxy each visitor has a code limit of their own', async ({
    db,
  }) => {
    const { auth } = createTestAuth(db, { TRUSTED_PROXIES: ['10.0.0.0/8'] });
    const requestCodeAs = (visitor: string, email: string) =>
      requestCode(auth, { email, ip: `${visitor}, 10.1.2.3` });

    for (let i = 0; i < 3; i++) await requestCodeAs('192.0.2.10', EMAIL);

    expect((await requestCodeAs('192.0.2.10', ANOTHER_EMAIL)).status).toBe(429);
    expect((await requestCodeAs('192.0.2.20', ANOTHER_EMAIL)).status).toBe(200);
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
    const own = await createPasskey(db, await userIdOf(auth, headers));
    await createPasskey(db, await createUser(db, 'bea@example.com'));

    const options = await auth.api.generatePasskeyRegistrationOptions({
      headers,
    });

    expect(options.excludeCredentials?.map(({ id }) => id)).toEqual([
      own.credentialID,
    ]);
  });

  test('adding a passkey takes a sign-in from the last day', async ({ db }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const staleCookie = await signIn(auth, sentCodes);
    await db.update(session).set({ createdAt: daysAgo(2) });

    const adding = auth.api.generatePasskeyRegistrationOptions({
      headers: new Headers({ host: HOST, cookie: staleCookie }),
    });
    await expect(adding).rejects.toMatchObject({
      statusCode: 403,
      body: { code: 'SESSION_NOT_FRESH' },
    });

    const freshCookie = await signIn(auth, sentCodes);
    const options = await auth.api.generatePasskeyRegistrationOptions({
      headers: new Headers({ host: HOST, cookie: freshCookie }),
    });
    expect(options.rp.id).toBe(RP_ID);
  });

  test("the list holds only the user's own passkeys", async ({ db }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const headers = new Headers({
      host: HOST,
      cookie: await signIn(auth, sentCodes),
    });
    const own = await createPasskey(db, await userIdOf(auth, headers));
    await createPasskey(db, await createUser(db, 'bea@example.com'));

    const passkeys = await auth.api.listPasskeys({ headers });

    expect(passkeys.map(({ id }) => id)).toEqual([own.id]);
  });

  test('a passkey is renamed and removed by its owner', async ({ db }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signIn(auth, sentCodes);
    const headers = new Headers({ host: HOST, cookie });
    const { id } = await createPasskey(db, await userIdOf(auth, headers));

    await post(auth, {
      path: '/passkey/update-passkey',
      body: { id, name: '  Work laptop ' },
      cookie,
    });
    expect(await auth.api.listPasskeys({ headers })).toMatchObject([
      { id, name: 'Work laptop' },
    ]);

    await post(auth, { path: '/passkey/delete-passkey', body: { id }, cookie });
    expect(await auth.api.listPasskeys({ headers })).toEqual([]);
  });

  test.for(['/passkey/update-passkey', '/passkey/delete-passkey'])(
    "someone else's passkey cannot be changed through %s",
    async (path, { db }) => {
      const { auth, sentCodes } = createTestAuth(db);
      const cookie = await signIn(auth, sentCodes);
      const beaId = await createUser(db, 'bea@example.com');
      const { id } = await createPasskey(db, beaId);

      const response = await post(auth, {
        path,
        body: { id, name: 'Mine now' },
        cookie,
      });

      expect(response.status).toBe(401);
      expect(
        await db
          .select({ name: passkey.name })
          .from(passkey)
          .where(eq(passkey.id, id)),
      ).toEqual([{ name: null }]);
    },
  );
});
