import { expect, type Page, test } from '@playwright/test';

const TAGLINE = {
  en: 'Open-source workspace for any goal you practise daily',
  ru: 'Рабочее пространство с открытым кодом для любой цели, к которой идут каждый день',
};

// Writes the `locale` cookie, as the language setting will, and reloads the page
async function pickLanguage(page: Page, locale: string) {
  await page
    .context()
    .addCookies([{ name: 'locale', value: locale, url: page.url() }]);
  await page.reload();
}

test.describe('with the browser in English', () => {
  test.use({ locale: 'en-US' });

  test('speaks English', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText(TAGLINE.en)).toBeVisible();
  });

  test('switches when a language is picked', async ({ page }) => {
    await page.goto('/');
    await pickLanguage(page, 'ru');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(page.getByText(TAGLINE.ru)).toBeVisible();
  });
});

test.describe('with the browser in Russian', () => {
  test.use({ locale: 'ru-RU' });

  test('speaks Russian until a language is picked', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(page.getByText(TAGLINE.ru)).toBeVisible();
  });

  test('the picked language wins', async ({ page }) => {
    await page.goto('/');
    await pickLanguage(page, 'en');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText(TAGLINE.en)).toBeVisible();
  });

  test('ignores a language Kotsu does not speak', async ({ page }) => {
    await page.goto('/');
    await pickLanguage(page, 'de');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  });
});
