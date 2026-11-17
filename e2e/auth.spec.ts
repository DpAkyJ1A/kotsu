import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test(
  'a private page sends a visitor without a session to sign-in',
  { tag: '@smoke' },
  async ({ page }) => {
    await page.goto('/practice');

    await expect(page).toHaveURL('/sign-in?next=%2Fpractice');
    await expect(
      page.getByRole('heading', { name: 'Sign in to Kotsu' }),
    ).toBeVisible();
  },
);

test('a session that has ended sends the visitor to sign in and back', async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    {
      name: 'better-auth.session_token',
      value: 'ended.signature',
      url: baseURL ?? '',
    },
  ]);

  await page.goto('/calendar?view=week');

  await expect(page).toHaveURL('/sign-in?next=%2Fcalendar%3Fview%3Dweek');
});

test(
  'the auth API answers on this host',
  { tag: '@smoke' },
  async ({ request }) => {
    const response = await request.get('/api/auth/get-session');

    expect(response.status()).toBe(200);
    expect(await response.json()).toBeNull();
  },
);

test(
  'the auth API refuses a request sent from another site',
  { tag: '@smoke' },
  async ({ request }) => {
    const response = await request.post('/api/auth/sign-out', {
      headers: {
        origin: 'https://example.com',
        cookie: 'better-auth.session_token=token.signature',
      },
      data: {},
    });

    expect(response.status()).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'INVALID_ORIGIN' });
  },
);
