import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test(
  'the home page is the calendar, behind sign-in',
  { tag: '@smoke' },
  async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/sign-in');
    await expect(page).toHaveTitle('Kotsu');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Sign in to Kotsu',
    );
  },
);
