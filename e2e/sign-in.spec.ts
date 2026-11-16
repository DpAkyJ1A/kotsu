import { expect, type Page } from '@playwright/test';

import { test } from './fixtures';

test.use({ locale: 'en-US' });

async function requestCode(page: Page, email: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(
    page.getByRole('heading', { name: 'Check your email' }),
  ).toBeVisible();
}

test.describe('with a session', () => {
  test.skip(
    ({ browserName, baseURL }) =>
      browserName === 'webkit' && baseURL?.startsWith('http://') === true,
    'WebKit drops the Secure session cookie on plain http, as the local and CI servers are',
  );

  test('signs in with the emailed code and signs out', async ({
    page,
    visitor,
  }) => {
    await requestCode(page, visitor.email);
    await page.getByLabel('Code').fill(await visitor.readCode());

    await expect(page).toHaveURL('/');
    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL('/sign-in');
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeHidden();
  });

  test('a signed-in visitor skips the sign-in page', async ({
    page,
    visitor,
  }) => {
    await requestCode(page, visitor.email);
    await page.getByLabel('Code').fill(await visitor.readCode());
    await expect(page).toHaveURL('/');

    await page.goto('/sign-in');

    await expect(page).toHaveURL('/');
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

test('a wrong code does not sign in', async ({ page, visitor }) => {
  await requestCode(page, visitor.email);
  const code = await visitor.readCode();

  await page.getByLabel('Code').fill(code === '000000' ? '111111' : '000000');

  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    "That code isn't right. Check the email and try again.",
  );
  await expect(page).toHaveURL(/\/sign-in\/code/);
});
