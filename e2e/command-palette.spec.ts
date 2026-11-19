import { expect, type Page } from '@playwright/test';

import { actionAnswered, signInWithCode, test } from './fixtures';

test.use({ locale: 'en-US' });

test.skip(
  ({ browserName, baseURL }) =>
    browserName === 'webkit' && baseURL?.startsWith('http://') === true,
  'WebKit drops the Secure session cookie on plain http, as the local and CI servers are',
);

const LIGHT = 'rgb(255, 255, 255)';
const DARK = 'rgb(18, 18, 20)';

test.beforeEach(async ({ page, visitor }) => {
  await signInWithCode(page, visitor);
  await expect(page).toHaveURL('/calendar');
});

function paletteOf(page: Page) {
  return page.getByRole('dialog', { name: 'Search and commands' });
}

async function runFromPalette(page: Page, option: string) {
  await page.keyboard.press('ControlOrMeta+K');
  await paletteOf(page).getByRole('option', { name: option }).click();
}

test('⌘K or Ctrl+K opens the palette, and a section opens from it', async ({
  page,
}) => {
  await runFromPalette(page, 'Practice');
  await expect(page).toHaveURL('/practice');

  await runFromPalette(page, 'Calendar');
  await expect(page).toHaveURL('/calendar');
  await expect(page).toHaveTitle('Calendar · Kotsu');
  await expect(paletteOf(page)).toBeHidden();
});

test('the search field in the sidebar opens the palette', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The sidebar is for wide screens');

  await page
    .locator('aside')
    .getByRole('button', { name: 'Search', exact: true })
    .click();
  await expect(paletteOf(page).getByRole('combobox')).toBeFocused();
  await page.keyboard.type('clo');
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL('/clock');
  await expect(paletteOf(page)).toBeHidden();
});

test('the palette flips the theme and saves it to the account', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('body')).toHaveCSS('background-color', DARK);

  const saved = actionAnswered(page);
  await runFromPalette(page, 'Toggle theme');
  await expect(page.locator('body')).toHaveCSS('background-color', LIGHT);
  await saved;

  await page.context().clearCookies({ name: 'theme' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', LIGHT);
});
