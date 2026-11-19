import 'server-only';

import { randomInt } from 'node:crypto';

import { vi } from 'vitest';

import type { Db } from '@/server/db/client';
import { account, passkey, user } from '@/server/db/schema/auth';

import { type Auth, createAuth } from './create-auth';
import { deployment, type DeploymentEnv } from './deployment';

export const TEST_SECRET = 'test-secret-with-at-least-32-characters';
export const RP_ID = 'localhost';
export const HOST = `${RP_ID}:5687`;
export const EMAIL = 'ada@example.com';
export const GOOGLE = {
  clientId: 'kotsu-test.apps.googleusercontent.com',
  clientSecret: 'test-google-secret',
};

export const GOOGLE_PROFILE = {
  sub: '108876543210123456789',
  email: EMAIL,
  email_verified: true,
  name: 'Ada Lovelace',
  picture: 'https://lh3.googleusercontent.com/a/ada',
};
export const GOOGLE_ACCESS_TOKEN = 'google-access-token';

const ORIGIN = `http://${HOST}`;
const IP_PER_TEST_FILE = ['10.0', randomInt(256), randomInt(1, 255)].join('.');
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export function createTestAuth(
  db: Db,
  deploymentEnv: Partial<DeploymentEnv> = {},
) {
  const sentCodes: string[] = [];
  const auth = createAuth({
    db,
    secret: TEST_SECRET,
    sendSignInCode: ({ otp }) => {
      sentCodes.push(otp);
      return Promise.resolve();
    },
    deployment: deployment({ TRUSTED_PROXIES: [], ...deploymentEnv }),
    google: GOOGLE,
  });
  return { auth, sentCodes };
}

type AuthRequest = {
  path: string;
  body: object;
  cookie?: string;
  ip?: string;
  origin?: string;
};

export function post(
  auth: Auth,
  { path, body, cookie, ip, origin = ORIGIN }: AuthRequest,
) {
  const headers = new Headers({ 'content-type': 'application/json', origin });
  if (cookie) headers.set('cookie', cookie);
  headers.set('x-forwarded-for', ip ?? IP_PER_TEST_FILE);

  return auth.handler(
    new Request(`${origin}/api/auth${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }),
  );
}

export function requestCode(auth: Auth) {
  return post(auth, {
    path: '/email-otp/send-verification-otp',
    body: { email: EMAIL, type: 'sign-in' },
  });
}

export function enterCode(auth: Auth, otp: string | undefined) {
  return post(auth, {
    path: '/sign-in/email-otp',
    body: { email: EMAIL, otp },
  });
}

export async function signIn(auth: Auth, sentCodes: string[]) {
  await requestCode(auth);
  return cookiesFrom(await enterCode(auth, sentCodes.at(-1)));
}

export async function createUser(db: Db, email: string) {
  const id = crypto.randomUUID();
  await db.insert(user).values({ id, name: email, email });
  return id;
}

export async function createPasskey(db: Db, userId: string) {
  const id = crypto.randomUUID();
  const credentialID = crypto.randomUUID();
  await db.insert(passkey).values({
    id,
    userId,
    credentialID,
    publicKey: 'unused-in-these-tests',
    counter: 0,
    deviceType: 'singleDevice',
    backedUp: false,
  });
  return { id, credentialID };
}

export async function createGoogleAccount(db: Db, userId: string) {
  const [created] = await db
    .insert(account)
    .values({ userId, providerId: 'google', accountId: crypto.randomUUID() })
    .returning({ id: account.id });
  if (!created) throw new Error(`No Google account for ${userId}`);
  return created.id;
}

export function cookiesFrom(response: Response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

export function googleAnswersWith(profile: object) {
  const tokenRequests: URLSearchParams[] = [];
  vi.stubGlobal(
    'fetch',
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      if (request.url !== GOOGLE_TOKEN_URL) {
        throw new Error(`Unexpected request to ${request.url}`);
      }
      tokenRequests.push(new URLSearchParams(await request.text()));
      return Response.json({
        access_token: GOOGLE_ACCESS_TOKEN,
        token_type: 'Bearer',
        expires_in: 3599,
        scope: 'openid email profile',
        id_token: idTokenOf(profile),
      });
    },
  );
  return tokenRequests;
}

function idTokenOf(profile: object) {
  const part = (json: object) =>
    Buffer.from(JSON.stringify(json)).toString('base64url');
  const claims = {
    iss: 'https://accounts.google.com',
    aud: GOOGLE.clientId,
    ...profile,
  };
  return `${part({ alg: 'none' })}.${part(claims)}.`;
}

type GoogleTrip = { state: string; cookie: string };

export async function goToGoogle(auth: Auth, request: AuthRequest) {
  const response = await post(auth, request);
  const { url } = (await response.json()) as { url: string };
  const googleURL = new URL(url);
  const cookie = [request.cookie, cookiesFrom(response)]
    .filter(Boolean)
    .join('; ');
  return {
    googleURL,
    state: googleURL.searchParams.get('state') ?? '',
    cookie,
  };
}

export function returnFromGoogle(auth: Auth, { state, cookie }: GoogleTrip) {
  const query = new URLSearchParams({ code: 'code-from-google', state });
  return auth.handler(
    new Request(`${ORIGIN}/api/auth/callback/google?${query}`, {
      headers: { cookie, 'x-forwarded-for': IP_PER_TEST_FILE },
    }),
  );
}
