import { describe, expect } from 'vitest';

import type { Auth } from '@/server/auth/create-auth';
import { createTestAuth, HOST, post, signIn } from '@/server/auth/testing';
import { loadCtx } from '@/server/ctx/load-ctx';
import type { Db } from '@/server/db/client';
import { session } from '@/server/db/schema/auth';
import { dbTest as test } from '@/server/db/testing';

const NOW = new Date('2026-11-02T09:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const UUID_V7 =
  /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/;

function openPage(auth: Auth, db: Db, cookie: string, locale: 'en' | 'ru') {
  return loadCtx({
    auth,
    db,
    headers: new Headers({ host: HOST, cookie }),
    locale,
    now: NOW,
  });
}

function forgeSignature(cookie: string) {
  const unsigned = cookie.slice(0, cookie.lastIndexOf('.'));
  return `${unsigned}.forged-signature`;
}

describe('loadCtx', () => {
  test('the code from the email opens private pages', async ({ db }) => {
    const { auth, sentCodes } = createTestAuth(db);

    const cookie = await signIn(auth, sentCodes);
    const ctx = await openPage(auth, db, cookie, 'ru');

    expect(ctx?.userId).toMatch(UUID_V7);
    expect(ctx?.now).toBe(NOW);
    expect(ctx?.settings).toMatchObject({ locale: 'ru', timezone: 'UTC' });
  });

  test('a visitor without a session gets no ctx', async ({ db }) => {
    const { auth } = createTestAuth(db);

    expect(await openPage(auth, db, '', 'en')).toBeNull();
  });

  test('a cookie with a forged signature gets no ctx', async ({ db }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signIn(auth, sentCodes);

    const forged = forgeSignature(cookie);

    expect(await openPage(auth, db, forged, 'en')).toBeNull();
  });

  test('after signing out the same cookie gets no ctx', async ({ db }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signIn(auth, sentCodes);

    await post(auth, { path: '/sign-out', body: {}, cookie });

    expect(await openPage(auth, db, cookie, 'en')).toBeNull();
  });

  test('leaves renewing the session to the browser, which can store the renewed cookie', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signIn(auth, sentCodes);
    const twoDaysOld = new Date(Date.now() + 5 * DAY_MS);
    await db.update(session).set({ expiresAt: twoDaysOld });

    await openPage(auth, db, cookie, 'en');

    const [row] = await db
      .select({ expiresAt: session.expiresAt })
      .from(session);
    expect(row?.expiresAt).toEqual(twoDaysOld);
  });

  test('settings are created once, in the language of the first visit', async ({
    db,
  }) => {
    const { auth, sentCodes } = createTestAuth(db);
    const cookie = await signIn(auth, sentCodes);

    await openPage(auth, db, cookie, 'ru');
    const later = await openPage(auth, db, cookie, 'en');

    expect(later?.settings.locale).toBe('ru');
  });
});
