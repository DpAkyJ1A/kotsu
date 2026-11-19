import { expect, type Page } from '@playwright/test';

import { actionAnswered, signInWithCode, test } from './fixtures';

test.use({ locale: 'en-US', colorScheme: 'light' });

test.skip(
  ({ browserName, baseURL }) =>
    browserName === 'webkit' && baseURL?.startsWith('http://') === true,
  'WebKit drops the Secure session cookie on plain http, as the local and CI servers are',
);
test.skip(
  ({ isMobile }) => isMobile,
  'The menu under the name is for wide screens; phones pick these in Settings (settings-screen.spec.ts)',
);

const LIGHT = 'rgb(255, 255, 255)';
const DARK = 'rgb(18, 18, 20)';

test.beforeEach(async ({ page, visitor }) => {
  await signInWithCode(page, visitor);
  await expect(page).toHaveURL('/calendar');
});

function accountButtonOf(page: Page, email: string) {
  const [emailName = ''] = email.split('@');
  return page.getByRole('button', { name: emailName, exact: true });
}

async function pickInMenu(page: Page, email: string, option: string) {
  await accountButtonOf(page, email).click();
  const saved = actionAnswered(page);
  await page.getByRole('menuitemradio', { name: option }).click();
  await saved;
  await page.keyboard.press('Escape');
}

async function forgetThisDevice(page: Page) {
  await page.context().clearCookies({ name: /^(theme|locale)$/ });
}

test('a theme picked in the menu shows at once and follows the account to another device', async ({
  page,
  visitor,
}) => {
  await pickInMenu(page, visitor.email, 'Dark');
  await expect(page.locator('body')).toHaveCSS('background-color', DARK);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await forgetThisDevice(page);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', DARK);
});

test('Auto hands the theme back to the system', async ({ page, visitor }) => {
  await pickInMenu(page, visitor.email, 'Dark');
  await pickInMenu(page, visitor.email, 'Auto');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.reload();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  await expect(page.locator('body')).toHaveCSS('background-color', DARK);
});

test('a language picked in the menu switches the app at once and follows the account', async ({
  page,
  visitor,
}) => {
  await pickInMenu(page, visitor.email, 'Русский');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(
    page.getByRole('heading', { name: 'Календарь', level: 1 }),
  ).toBeVisible();

  await forgetThisDevice(page);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page).toHaveTitle('Календарь · Kotsu');
});

test('after signing out, the sign-in page keeps what was picked on this device', async ({
  page,
  visitor,
}) => {
  await pickInMenu(page, visitor.email, 'Dark');
  await pickInMenu(page, visitor.email, 'Русский');

  await accountButtonOf(page, visitor.email).click();
  await page.getByRole('menuitem', { name: 'Выйти' }).click();

  await expect(page).toHaveURL('/sign-in');
  await expect(
    page.getByRole('heading', { name: 'Вход в Kotsu' }),
  ).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('background-color', DARK);
});

test('the light theme picked on a dark system stays light', async ({
  page,
  visitor,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await pickInMenu(page, visitor.email, 'Light');

  await page.reload();
  await expect(page.locator('body')).toHaveCSS('background-color', LIGHT);
});

test('a theme picked offline stays on the page and is saved once back online', async ({
  page,
  visitor,
}) => {
  await accountButtonOf(page, visitor.email).click();
  await page.context().setOffline(true);
  await page.getByRole('menuitemradio', { name: 'Dark' }).click();

  await expect(page.locator('body')).toHaveCSS('background-color', DARK);
  await expect(page.getByRole('menuitemradio', { name: 'Dark' })).toBeChecked();

  const saved = actionAnswered(page);
  await page.context().setOffline(false);
  await saved;
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('the language stays as it was when picked offline', async ({
  page,
  visitor,
}) => {
  await accountButtonOf(page, visitor.email).click();
  await page.context().setOffline(true);
  await page.getByRole('menuitemradio', { name: 'Русский' }).click();

  await expect(
    page.getByText("You're offline. Try again once you're back online."),
  ).toBeVisible();
  await expect(
    page.getByRole('menuitemradio', { name: 'English' }),
  ).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
