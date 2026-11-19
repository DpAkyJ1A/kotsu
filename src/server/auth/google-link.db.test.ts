import { afterEach, describe, expect, vi } from 'vitest';

import type { Auth } from '@/server/auth/create-auth';
import {
  cookiesFrom,
  createGoogleAccount,
  createTestAuth,
  createUser,
  GOOGLE_PROFILE,
  googleAnswersWith,
  goToGoogle,
  post,
  returnFromGoogle,
  signIn,
} from '@/server/auth/testing';
import { account, session, user } from '@/server/db/schema/auth';
import { dbTest as test } from '@/server/db/testing';

const SETTINGS_PAGE = '/calendar?settings=security';
const DAY_MS = 24 * 60 * 60 * 1000;

afterEach(() => {
  vi.unstubAllGlobals();
});

async function connectGoogle(auth: Auth, cookie: string) {
  const trip = await goToGoogle(auth, {
    path: '/link-social',
    body: {
      provider: 'google',
      callbackURL: SETTINGS_PAGE,
      errorCallbackURL: SETTINGS_PAGE,
    },
    cookie,
  });
  return returnFromGoogle(auth, trip);
}

async function signUpWithGoogle(auth: Auth) {
  googleAnswersWith(GOOGLE_PROFILE);
  const trip = await goToGoogle(auth, {
    path: '/sign-in/social',
    body: { provider: 'google', callbackURL: '/calendar' },
  });
  return cookiesFrom(await returnFromGoogle(auth, trip));
}

function disconnect(auth: Auth, cookie: string, accountId: string) {
  return post(auth, { path: '/unlink-account', body: { accountId }, cookie });
}

describe('connecting Google in the settings', () => {
  test('a Google account with the same email joins the signed-in account', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signIn(auth, sentCodes);
    const [byCode] = await db.select().from(user);
    googleAnswersWith(GOOGLE_PROFILE);

    const response = await connectGoogle(auth, cookie);

    expect(response.headers.get('location')).toBe(SETTINGS_PAGE);
    expect(await db.select().from(account)).toMatchObject([
      {
        userId: byCode?.id,
        providerId: 'google',
        accountId: GOOGLE_PROFILE.sub,
      },
    ]);
    expect(await db.select().from(user)).toEqual([byCode]);
  });

  test('a Google account with another email is not connected', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signIn(auth, sentCodes);
    googleAnswersWith({ ...GOOGLE_PROFILE, email: 'ada@gmail.com' });

    const response = await connectGoogle(auth, cookie);

    expect(response.headers.get('location')).toMatch(
      /^\/calendar\?settings=security&error=email_does_not_match(&|$)/,
    );
    expect(await db.select().from(account)).toEqual([]);
  });

  test('an email that Google has not verified is not connected', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signIn(auth, sentCodes);
    googleAnswersWith({ ...GOOGLE_PROFILE, email_verified: false });

    const response = await connectGoogle(auth, cookie);

    expect(response.headers.get('location')).toMatch(
      /^\/calendar\?settings=security&error=unable_to_link_account(&|$)/,
    );
    expect(await db.select().from(account)).toEqual([]);
  });

  test('connecting the same Google account again keeps one link', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signIn(auth, sentCodes);
    googleAnswersWith(GOOGLE_PROFILE);

    await connectGoogle(auth, cookie);
    const response = await connectGoogle(auth, cookie);

    expect(response.headers.get('location')).toBe(SETTINGS_PAGE);
    expect(await db.select().from(account)).toHaveLength(1);
  });

  test('a Google account already linked to another user is not taken over', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signIn(auth, sentCodes);
    const bea = await createUser(db, 'bea@example.com');
    await db.insert(account).values({
      userId: bea,
      providerId: 'google',
      accountId: GOOGLE_PROFILE.sub,
    });
    googleAnswersWith(GOOGLE_PROFILE);

    const response = await connectGoogle(auth, cookie);

    expect(response.headers.get('location')).toMatch(
      /^\/calendar\?settings=security&error=account_already_linked_to_different_user(&|$)/,
    );
    expect(await db.select().from(account)).toMatchObject([{ userId: bea }]);
  });
});

describe('disconnecting Google in the settings', () => {
  test('works even when Google was the only way in, and the email code still opens the same account', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signUpWithGoogle(auth);
    const [google] = await db.select().from(account);

    const response = await disconnect(auth, cookie, google?.id ?? '');
    await signIn(auth, sentCodes);

    expect(response.status).toBe(200);
    expect(await db.select().from(account)).toEqual([]);
    expect(await db.select().from(user)).toMatchObject([
      { id: google?.userId },
    ]);
  });

  test('a day after signing in, it asks to confirm with a fresh sign-in first', async ({
    db,
  }) => {
    const { auth } = createTestAuth(db);
    const cookie = await signUpWithGoogle(auth);
    const [google] = await db.select().from(account);
    await db
      .update(session)
      .set({ createdAt: new Date(Date.now() - 2 * DAY_MS) });

    const response = await disconnect(auth, cookie, google?.id ?? '');

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'SESSION_NOT_FRESH' });
    expect(await db.select().from(account)).toHaveLength(1);
  });

  test("one user cannot disconnect another user's Google", async ({ db }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signIn(auth, sentCodes);
    const bea = await createUser(db, 'bea@example.com');
    const beasGoogle = await createGoogleAccount(db, bea);

    const response = await disconnect(auth, cookie, beasGoogle);

    expect(response.status).toBe(400);
    expect(await db.select().from(account)).toMatchObject([{ userId: bea }]);
  });
});
