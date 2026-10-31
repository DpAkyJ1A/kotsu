import { expect, test } from '@playwright/test';

test('home page renders', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Kotsu');
  await expect(page.getByRole('main')).toBeAttached();
});
