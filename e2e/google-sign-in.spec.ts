import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

const WITHOUT_GOOGLE_URL = 'http://localhost:5688';

test.describe('with Google keys', () => {
  test('the button sends the visitor to Google with our callback, a state and PKCE', async ({
    page,
    baseURL,
  }) => {
    const googleURL = Promise.withResolvers<URL>();
    await page.route('https://accounts.google.com/**', async (route) => {
      googleURL.resolve(new URL(route.request().url()));
      await route.fulfill({ contentType: 'text/plain', body: 'Google' });
    });
    await page.goto('/sign-in?next=%2Fpractice');

    await page.getByRole('button', { name: 'Continue with Google' }).click();
    const url = await googleURL.promise;

    expect(url.pathname).toBe('/o/oauth2/v2/auth');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      redirect_uri: `${baseURL ?? ''}/api/auth/callback/google`,
      response_type: 'code',
      prompt: 'select_account',
      code_challenge_method: 'S256',
    });
    for (const param of ['client_id', 'state', 'code_challenge']) {
      expect(url.searchParams.get(param)).toBeTruthy();
    }
  });

  test('cancelling on Google comes back to a clean sign-in page', async ({
    page,
  }) => {
    await page.goto('/sign-in?next=%2Fpractice&error=access_denied');

    await expect(page).toHaveURL('/sign-in?next=%2Fpractice');
    await expect(
      page.getByRole('button', { name: 'Continue with Google' }),
    ).toBeVisible();
    await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
  });

  test('a failed Google sign-in says so under the button', async ({ page }) => {
    await page.goto('/sign-in?error=state_mismatch');

    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      "Couldn't sign in with Google. Try again, or sign in with your email.",
    );
  });
});

test('without Google keys the sign-in page has no Google button', async ({
  page,
}) => {
  await page.goto(`${WITHOUT_GOOGLE_URL}/sign-in`);

  await expect(page.getByRole('button', { name: 'Send code' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Continue with Google' }),
  ).toHaveCount(0);
  await expect(page.getByText('or', { exact: true })).toHaveCount(0);
});
