import 'server-only';

import type { Db } from '@/server/db/client';

import { type Auth, createAuth } from './create-auth';

export const TEST_SECRET = 'test-secret-with-at-least-32-characters';
export const HOST = 'localhost:5687';
export const EMAIL = 'ada@example.com';

const ORIGIN = `http://${HOST}`;

export function createTestAuth(db: Db) {
  const sentCodes: string[] = [];
  const auth = createAuth({
    db,
    secret: TEST_SECRET,
    sendSignInCode: ({ otp }) => {
      sentCodes.push(otp);
      return Promise.resolve();
    },
  });
  return { auth, sentCodes };
}

type AuthRequest = { path: string; body: object; cookie?: string };

export function post(auth: Auth, { path, body, cookie = '' }: AuthRequest) {
  return auth.handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN, cookie },
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

export function cookiesFrom(response: Response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}
