import { type BrowserContext, expect, type Page } from '@playwright/test';
import { eq } from 'drizzle-orm';

import { passkey } from '@/server/db/schema/auth';

import { requestCode, signInWithCode, test } from './fixtures';

test.use({ locale: 'en-US' });

async function turnOnPasskey(page: Page) {
  await page.getByRole('button', { name: 'Turn on passkey' }).click();
  await expect(page).toHaveURL('/calendar');
}

async function switchToAnotherDevice(context: BrowserContext) {
  const credentials = await context.credentials.get();
  await Promise.all(
    credentials.map(({ id }) => context.credentials.delete(id)),
  );
  await context.clearCookies();
}

test.describe('with a session', () => {
  test.skip(
    ({ browserName, baseURL }) =>
      browserName === 'webkit' && baseURL?.startsWith('http://') === true,
    'WebKit drops the Secure session cookie on plain http, as the local and CI servers are',
  );

  test('signs in with the emailed code and opens the calendar', async ({
    page,
    visitor,
  }) => {
    await signInWithCode(page, visitor);

    await expect(page).toHaveURL('/calendar');
    await expect(
      page.getByRole('heading', { name: 'Calendar', level: 1 }),
    ).toBeVisible();
  });

  test('a signed-in visitor skips the sign-in page', async ({
    page,
    visitor,
  }) => {
    await signInWithCode(page, visitor);
    await expect(page).toHaveURL('/calendar');

    await page.goto('/sign-in');

    await expect(page).toHaveURL('/calendar');
  });

  test.describe('on a device with a passkey authenticator', () => {
    test.beforeEach(async ({ context }) => {
      await context.credentials.install();
    });

    test('turns on a passkey after the code, then signs in with it', async ({
      page,
      context,
      visitor,
    }) => {
      await signInWithCode(page, visitor);
      await turnOnPasskey(page);

      await context.clearCookies();
      await page.goto('/sign-in');

      await expect(page).toHaveURL('/calendar');
      const [credential] = await context.credentials.get({ rpId: 'localhost' });
      expect(credential?.signCount).toBe(1);
    });

    test('"Not now" goes on without a passkey', async ({
      page,
      context,
      visitor,
    }) => {
      await signInWithCode(page, visitor);

      await page.getByRole('button', { name: 'Not now' }).click();

      await expect(page).toHaveURL('/calendar');
      expect(await context.credentials.get()).toEqual([]);
    });

    test('a device that answered the offer is not asked again', async ({
      page,
      context,
      visitor,
    }) => {
      await signInWithCode(page, visitor);
      await page.getByRole('button', { name: 'Not now' }).click();
      await expect(page).toHaveURL('/calendar');
      await context.clearCookies({ name: /session_token$/ });

      await signInWithCode(page, visitor);

      await expect(page).toHaveURL('/calendar');
    });

    test('a device that already holds the passkey moves on without a second one', async ({
      page,
      context,
      visitor,
    }) => {
      await signInWithCode(page, visitor);
      await turnOnPasskey(page);
      await context.clearCookies();
      await page.goto('/sign-in');
      await expect(page).toHaveURL('/calendar');

      await page.goto('/sign-in/passkey');
      await turnOnPasskey(page);

      expect(await context.credentials.get()).toHaveLength(1);
    });

    test('another device of the same account gets a passkey of its own', async ({
      page,
      context,
      visitor,
    }) => {
      await signInWithCode(page, visitor);
      await turnOnPasskey(page);
      await switchToAnotherDevice(context);

      await signInWithCode(page, visitor);
      await turnOnPasskey(page);
      await context.clearCookies();
      await page.goto('/sign-in');

      await expect(page).toHaveURL('/calendar');
    });

    test('a passkey left on the device after the account lost it asks for the code', async ({
      page,
      context,
      visitor,
      db,
    }) => {
      await signInWithCode(page, visitor);
      await turnOnPasskey(page);
      const [credential] = await context.credentials.get();
      await db
        .delete(passkey)
        .where(eq(passkey.credentialID, credential?.id ?? ''));
      await context.clearCookies();

      await page.goto('/sign-in');

      await expect(page.getByRole('main').getByRole('alert')).toHaveText(
        "That passkey didn't work. Sign in with a code instead.",
      );
      await expect(page).toHaveURL('/sign-in');
    });
  });
});

test('an email typed before the page is ready still gets a code', async ({
  page,
  visitor,
}) => {
  const emailTyped = Promise.withResolvers<string>();
  await page.route(/\/_next\/static\/.+\.js$/, async (route) => {
    await emailTyped.promise;
    await route.continue();
  });
  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });

  await page.getByLabel('Email').fill(visitor.email);
  emailTyped.resolve(visitor.email);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Send code' }).click();

  await expect(
    page.getByRole('heading', { name: 'Check your email' }),
  ).toBeVisible();
});

test('the passkey offer without a session asks to sign in first', async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    {
      name: 'better-auth.session_token',
      value: 'expired.signature',
      url: baseURL ?? '',
    },
  ]);

  await page.goto('/sign-in/passkey?next=%2Fpractice');

  await expect(page).toHaveURL('/sign-in?next=%2Fpractice');
});

test('a wrong code does not sign in', async ({ page, visitor }) => {
  await requestCode(page, visitor.email);
  const code = await visitor.readCode();

  await page.getByLabel('Code').fill(code === '000000' ? '111111' : '000000');

  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    "That code isn't right. Check the email and try again.",
  );
  await expect(page).toHaveURL(/\/sign-in\/code/);
});
