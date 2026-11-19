import { expect, test } from '@playwright/test';

test.describe('with the browser in English', () => {
  test.use({ locale: 'en-US' });

  test(
    'opens from the sign-in page without an account',
    { tag: '@smoke' },
    async ({ page }) => {
      await page.goto('/sign-in');
      await page.getByRole('link', { name: 'Privacy policy' }).click();

      await expect(page).toHaveURL('/privacy');
      await expect(page).toHaveTitle('Privacy policy · Kotsu');
      await expect(
        page.getByRole('heading', { name: 'Privacy policy', level: 1 }),
      ).toBeVisible();
    },
  );
});

test.describe('with the browser in Russian', () => {
  test.use({ locale: 'ru-RU' });

  test('speaks Russian', async ({ page }) => {
    await page.goto('/privacy');

    await expect(
      page.getByRole('heading', {
        name: 'Политика конфиденциальности',
        level: 1,
      }),
    ).toBeVisible();
  });
});
