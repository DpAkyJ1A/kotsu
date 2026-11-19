import { describe, expect, vi } from 'vitest';

import {
  createTestAuth,
  createUser,
  requestCode,
  signIn,
} from '@/server/auth/testing';
import type { Db } from '@/server/db/client';
import { rateLimit, session, verification } from '@/server/db/schema/auth';
import { dbTest as test } from '@/server/db/testing';

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

function fromNow(ms: number) {
  return new Date(Date.now() + ms);
}

async function addSession(db: Db, expiresAt: Date) {
  const userId = await createUser(db, `${crypto.randomUUID()}@example.com`);
  const token = crypto.randomUUID();
  await db.insert(session).values({ token, userId, expiresAt });
  return token;
}

async function addCode(db: Db, expiresAt: Date) {
  const identifier = crypto.randomUUID();
  await db
    .insert(verification)
    .values({ identifier, value: 'code', expiresAt });
  return identifier;
}

async function sessionTokens(db: Db) {
  const rows = await db.select({ token: session.token }).from(session);
  return rows.map((row) => row.token);
}

async function codeIdentifiers(db: Db) {
  const rows = await db
    .select({ identifier: verification.identifier })
    .from(verification);
  return rows.map((row) => row.identifier);
}

async function requestCountKeys(db: Db) {
  const rows = await db.select({ key: rateLimit.key }).from(rateLimit);
  return rows.map((row) => row.key);
}

describe('expired sign-in records', () => {
  test("a sign-in deletes expired sessions and codes, even right after a sign-in that used up Better Auth's own once-a-minute sweep, and keeps live ones", async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    await signIn(auth, sentCodes);
    const expiredSession = await addSession(db, fromNow(-DAY_MS));
    const liveSession = await addSession(db, fromNow(DAY_MS));
    const expiredCode = await addCode(db, fromNow(-MINUTE_MS));
    const liveCode = await addCode(db, fromNow(MINUTE_MS));

    await signIn(auth, sentCodes);

    expect(await sessionTokens(db)).toContain(liveSession);
    expect(await sessionTokens(db)).not.toContain(expiredSession);
    expect(await codeIdentifiers(db)).toContain(liveCode);
    expect(await codeIdentifiers(db)).not.toContain(expiredCode);
  });

  test('a cleanup that fails is logged and the sign-in still goes through', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const failure = new Error('the database went away');
    const deleteRows = db.delete.bind(db);
    vi.spyOn(db, 'delete').mockImplementation((table) => {
      if (table === session) throw failure;
      return deleteRows(table);
    });
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const cookie = await signIn(auth, sentCodes);

    expect(cookie).toContain('session_token');
    expect(log).toHaveBeenCalledWith(failure);
  });

  test('Better Auth deletes request counts a minute after the last request', async ({
    db,
  }) => {
    const { auth } = createTestAuth(db);
    await requestCode(auth);
    const ownKeys = await requestCountKeys(db);
    const twoMinutesAgo = Date.now() - 2 * MINUTE_MS;
    await db.update(rateLimit).set({ lastRequest: twoMinutesAgo });
    await db.insert(rateLimit).values({
      key: 'another-visitor',
      count: 1,
      lastRequest: twoMinutesAgo,
    });

    await requestCode(auth);

    expect(await requestCountKeys(db)).toEqual(ownKeys);
  });
});
