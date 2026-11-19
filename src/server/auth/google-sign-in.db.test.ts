import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, vi } from 'vitest';

import type { Auth } from '@/server/auth/create-auth';
import {
  cookiesFrom,
  createTestAuth,
  EMAIL,
  GOOGLE,
  GOOGLE_ACCESS_TOKEN,
  GOOGLE_PROFILE,
  googleAnswersWith,
  goToGoogle,
  HOST,
  returnFromGoogle,
  signIn,
} from '@/server/auth/testing';
import { account, user } from '@/server/db/schema/auth';
import { dbTest as test } from '@/server/db/testing';

afterEach(() => {
  vi.unstubAllGlobals();
});

function startGoogleSignIn(auth: Auth) {
  return goToGoogle(auth, {
    path: '/sign-in/social',
    body: {
      provider: 'google',
      callbackURL: '/calendar',
      errorCallbackURL: '/sign-in',
    },
  });
}

async function signInWithGoogle(auth: Auth) {
  return returnFromGoogle(auth, await startGoogleSignIn(auth));
}

describe('sign-in with Google', () => {
  test('sends the visitor to Google with our client, our callback and PKCE', async ({
    db,
  }) => {
    const { auth } = createTestAuth(db);

    const { googleURL } = await startGoogleSignIn(auth);

    expect(googleURL.origin + googleURL.pathname).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
    expect(Object.fromEntries(googleURL.searchParams)).toMatchObject({
      client_id: GOOGLE.clientId,
      redirect_uri: `http://${HOST}/api/auth/callback/google`,
      response_type: 'code',
      scope: 'email profile openid',
      prompt: 'select_account',
      code_challenge_method: 'S256',
    });
    expect(googleURL.searchParams.get('state')).toBeTruthy();
    expect(googleURL.searchParams.get('code_challenge')).toBeTruthy();
  });

  test('the callback address follows the host the visitor came from', async ({
    db,
  }) => {
    const { auth } = createTestAuth(db);
    const origin = 'https://kotsu.devazx.com';

    const response = await auth.handler(
      new Request(`${origin}/api/auth/sign-in/social`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin },
        body: JSON.stringify({ provider: 'google', callbackURL: '/calendar' }),
      }),
    );
    const { url } = (await response.json()) as { url: string };

    expect(new URL(url).searchParams.get('redirect_uri')).toBe(
      `${origin}/api/auth/callback/google`,
    );
  });

  test('a new visitor gets an account with the name and photo from Google', async ({
    db,
  }) => {
    const { auth } = createTestAuth(db);
    const tokenRequests = googleAnswersWith(GOOGLE_PROFILE);

    const response = await signInWithGoogle(auth);
    const users = await db.select().from(user);

    expect(response.headers.get('location')).toBe('/calendar');
    expect(cookiesFrom(response)).toContain('better-auth.session_token=');
    expect(tokenRequests[0]?.get('code')).toBe('code-from-google');
    expect(tokenRequests[0]?.get('code_verifier')).toBeTruthy();
    expect(users).toMatchObject([
      {
        email: EMAIL,
        emailVerified: true,
        name: 'Ada Lovelace',
        image: GOOGLE_PROFILE.picture,
      },
    ]);
  });

  test('Google on an email signed up by code opens the same account, name untouched', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    await signIn(auth, sentCodes);
    const [byCode] = await db.select().from(user);
    googleAnswersWith(GOOGLE_PROFILE);

    const response = await signInWithGoogle(auth);
    const users = await db.select().from(user);
    const googleAccounts = await db
      .select()
      .from(account)
      .where(eq(account.providerId, 'google'));

    expect(response.headers.get('location')).toBe('/calendar');
    expect(users).toEqual([byCode]);
    expect(googleAccounts).toMatchObject([
      { userId: byCode?.id, accountId: GOOGLE_PROFILE.sub },
    ]);
  });

  test('a Google email that Google has not verified does not open an account signed up by code', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    await signIn(auth, sentCodes);
    googleAnswersWith({ ...GOOGLE_PROFILE, email_verified: false });

    const response = await signInWithGoogle(auth);

    expect(response.headers.get('location')).toBe(
      '/sign-in?error=account_not_linked',
    );
    expect(cookiesFrom(response)).not.toContain('session_token');
    expect(await db.select().from(account)).toEqual([]);
  });

  test('an email that Google has not verified does not make a new account, so no one can claim it before its owner', async ({
    db,
  }) => {
    const { auth } = createTestAuth(db);
    googleAnswersWith({ ...GOOGLE_PROFILE, email_verified: false });

    const response = await signInWithGoogle(auth);

    expect(response.headers.get('location')).toBe(
      '/sign-in?error=unable_to_create_user',
    );
    expect(cookiesFrom(response)).not.toContain('session_token');
    expect(await db.select().from(user)).toEqual([]);
  });

  test('the Google tokens are stored encrypted', async ({ db }) => {
    const { auth } = createTestAuth(db);
    googleAnswersWith(GOOGLE_PROFILE);

    await signInWithGoogle(auth);
    const [stored] = await db.select().from(account);

    expect(stored?.accessToken).toBeTruthy();
    expect(stored?.accessToken).not.toContain(GOOGLE_ACCESS_TOKEN);
  });

  test('a state from another sign-in is refused', async ({ db }) => {
    const { auth } = createTestAuth(db);
    googleAnswersWith(GOOGLE_PROFILE);
    const mine = await startGoogleSignIn(auth);
    const someoneElses = await startGoogleSignIn(auth);

    const response = await returnFromGoogle(auth, {
      state: someoneElses.state,
      cookie: mine.cookie,
    });

    expect(response.headers.get('location')).toBe(
      '/sign-in?error=state_mismatch',
    );
    expect(await db.select().from(user)).toEqual([]);
  });

  test('a return from Google that this browser never started lands on the sign-in page', async ({
    db,
  }) => {
    const { auth } = createTestAuth(db);

    const response = await returnFromGoogle(auth, {
      state: 'made-up-state',
      cookie: '',
    });

    expect(response.headers.get('location')).toMatch(/^\/sign-in\?error=/);
  });
});
