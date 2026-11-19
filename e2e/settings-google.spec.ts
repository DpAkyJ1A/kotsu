import { randomUUID } from 'node:crypto';

import { expect, type Page } from '@playwright/test';
import { eq, like } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { account, verification } from '@/server/db/schema/auth';

import {
  signedInDaysAgo,
  signInWithCode,
  test,
  userIdOf,
  WITHOUT_GOOGLE_URL,
} from './fixtures';

const PHONE = { width: 390, height: 844 };

test.use({ locale: 'en-US', colorScheme: 'light' });

test.skip(
  ({ browserName, baseURL }) =>
    browserName === 'webkit' && baseURL?.startsWith('http://') === true,
  'WebKit drops the Secure session cookie on plain http, as the local and CI servers are',
);

test.beforeEach(async ({ page, visitor }) => {
  await signInWithCode(page, visitor);
  await expect(page).toHaveURL(/^[^?]*\/(calendar|sign-in\/passkey)/);
});

async function connectGoogleInTheDatabase(db: NodePgDatabase, email: string) {
  await db.insert(account).values({
    userId: await userIdOf(db, email),
    providerId: 'google',
    accountId: randomUUID(),
  });
}

async function googleAccountsOf(db: NodePgDatabase, email: string) {
  return db
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, await userIdOf(db, email)));
}

async function savedTripTo(db: NodePgDatabase, state: string) {
  const [saved] = await db
    .select({ value: verification.value })
    .from(verification)
    .where(like(verification.value, `%"oauthState":"${state}"%`));
  return saved ? (JSON.parse(saved.value) as unknown) : undefined;
}

function googleIn(page: Page) {
  return page.getByRole('region', { name: 'Google' });
}

test.describe('on a wide screen', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'Phones open the settings as pages, below',
  );

  test('Connect sends the visitor to Google to link this account and come back to the same settings', async ({
    page,
    baseURL,
    visitor,
    db,
  }) => {
    const googleURL = Promise.withResolvers<URL>();
    await page.route('https://accounts.google.com/**', async (route) => {
      googleURL.resolve(new URL(route.request().url()));
      await route.fulfill({ contentType: 'text/plain', body: 'Google' });
    });
    await page.goto('/calendar?settings=security');
    const google = googleIn(page);
    await expect(google).toContainText('Not connected');

    await google.getByRole('button', { name: 'Connect' }).click();
    const url = await googleURL.promise;

    expect(url.pathname).toBe('/o/oauth2/v2/auth');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      redirect_uri: `${baseURL ?? ''}/api/auth/callback/google`,
      response_type: 'code',
      code_challenge_method: 'S256',
    });
    for (const param of ['client_id', 'state', 'code_challenge']) {
      expect(url.searchParams.get(param)).toBeTruthy();
    }
    expect(
      await savedTripTo(db, url.searchParams.get('state') ?? ''),
    ).toMatchObject({
      callbackURL: '/calendar?settings=security',
      errorURL: '/calendar?settings=security',
      link: { email: visitor.email, userId: await userIdOf(db, visitor.email) },
    });
  });

  test('back from Google with another email, the settings say so and the address is clean again', async ({
    page,
    visitor,
  }) => {
    await page.goto(
      '/calendar?settings=security&error=email_does_not_match&error_description=Account+not+linked',
    );

    await expect(googleIn(page).getByRole('alert')).toHaveText(
      `That Google account has another email. Pick the one with ${visitor.email}.`,
    );
    await expect(page).toHaveURL('/calendar?settings=security');
  });

  test('a way back to another site is refused before Google', async ({
    page,
    baseURL,
  }) => {
    const response = await page.request.post('/api/auth/link-social', {
      headers: { origin: baseURL ?? '' },
      data: {
        provider: 'google',
        callbackURL: 'https://evil.example/settings',
      },
    });

    expect(response.status()).toBe(403);
  });

  test('a cancel on Google comes back to the settings without a message', async ({
    page,
  }) => {
    await page.goto('/calendar?settings=security&error=access_denied');

    await expect(page).toHaveURL('/calendar?settings=security');
    await expect(googleIn(page)).toContainText('Not connected');
    await expect(googleIn(page).getByRole('alert')).toHaveCount(0);
  });

  test('a connected Google shows the account email and disconnects', async ({
    page,
    visitor,
    db,
  }) => {
    await connectGoogleInTheDatabase(db, visitor.email);
    await page.goto('/calendar?settings=security');
    const google = googleIn(page);
    await expect(google).toContainText(`Connected${visitor.email}`);

    await google.getByRole('button', { name: 'Disconnect' }).click();

    await expect(google).toContainText('Not connected');
    await expect(google.getByRole('button', { name: 'Connect' })).toBeFocused();
    expect(await googleAccountsOf(db, visitor.email)).toEqual([]);
  });

  test('a day after signing in, disconnecting asks for an emailed code first', async ({
    page,
    visitor,
    db,
  }) => {
    await connectGoogleInTheDatabase(db, visitor.email);
    await signedInDaysAgo(db, visitor.email, 2);
    await page.goto('/calendar?settings=security');
    const google = googleIn(page);

    await google.getByRole('button', { name: 'Disconnect' }).click();
    const confirmation = google.getByRole('group', {
      name: "Confirm it's you",
    });
    await confirmation.getByRole('button', { name: 'Send code' }).click();
    const code = confirmation.getByLabel('Code');
    await expect(code).toBeVisible();
    await code.fill(await visitor.readCode());
    await confirmation.getByRole('button', { name: 'Confirm' }).click();

    await expect(google).toContainText('Not connected');
    await expect(confirmation).toBeHidden();
    await expect(google.getByRole('button', { name: 'Connect' })).toBeFocused();
    expect(await googleAccountsOf(db, visitor.email)).toEqual([]);
  });

  test('without Google keys the settings have no Google block', async ({
    page,
  }) => {
    await page.goto(`${WITHOUT_GOOGLE_URL}/calendar?settings=security`);

    await expect(
      page.getByRole('region', { name: 'Passkeys' }).getByRole('button', {
        name: 'Add passkey',
      }),
    ).toBeVisible();
    await expect(googleIn(page)).toHaveCount(0);
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: PHONE });

  test('Google sits on the sign-in settings page and disconnects there', async ({
    page,
    visitor,
    db,
  }) => {
    await connectGoogleInTheDatabase(db, visitor.email);
    await page.goto('/settings/security');
    const google = googleIn(page);

    await google.getByRole('button', { name: 'Disconnect' }).click();

    await expect(google).toContainText('Not connected');
    expect(await googleAccountsOf(db, visitor.email)).toEqual([]);
  });
});
