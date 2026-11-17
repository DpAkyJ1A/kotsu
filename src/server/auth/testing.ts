import 'server-only';

import type { Db } from '@/server/db/client';
import { passkey, user } from '@/server/db/schema/auth';

import { type Auth, createAuth } from './create-auth';

export const TEST_SECRET = 'test-secret-with-at-least-32-characters';
export const RP_ID = 'localhost';
export const HOST = `${RP_ID}:5687`;
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
    rpID: RP_ID,
  });
  return { auth, sentCodes };
}

type AuthRequest = {
  path: string;
  body: object;
  cookie?: string;
  ip?: string;
};

export function post(auth: Auth, { path, body, cookie, ip }: AuthRequest) {
  const headers = new Headers({
    'content-type': 'application/json',
    origin: ORIGIN,
  });
  if (cookie) headers.set('cookie', cookie);
  if (ip) headers.set('x-forwarded-for', ip);

  return auth.handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
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

export function cookiesFrom(response: Response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}
