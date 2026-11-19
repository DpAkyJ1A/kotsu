import { expect, type Page } from '@playwright/test';

import { actionAnswered, signInWithCode, test } from './fixtures';

const PHONE = { width: 390, height: 844 };

test.use({ locale: 'en-US', colorScheme: 'light' });

test.skip(
  ({ browserName, baseURL }) =>
    browserName === 'webkit' && baseURL?.startsWith('http://') === true,
  'WebKit drops the Secure session cookie on plain http, as the local and CI servers are',
);

test.beforeEach(async ({ page, visitor }) => {
  await signInWithCode(page, visitor);
  await expect(page).toHaveURL('/calendar');
});

function settingsDialogOf(page: Page) {
  return page.getByRole('dialog', { name: 'Settings' });
}

function accountButtonOf(page: Page, email: string) {
  const [emailName = ''] = email.split('@');
  return page.locator('aside').getByRole('button', { name: emailName });
}

test.describe('on a wide screen', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'Phones open the settings as pages, below',
  );

  test('⌘, opens the settings over the page, and a week start picked there stays', async ({
    page,
  }) => {
    await page.keyboard.press('ControlOrMeta+Comma');
    const dialog = settingsDialogOf(page);
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL('/calendar?settings=account');

    await dialog.getByRole('button', { name: 'Appearance' }).click();
    await expect(page).toHaveURL('/calendar?settings=appearance');
    const saved = actionAnswered(page);
    await dialog.getByRole('radio', { name: 'Sunday' }).click();
    await saved;

    await page.reload();
    await expect(
      settingsDialogOf(page).getByRole('radio', { name: 'Sunday' }),
    ).toBeChecked();
  });

  test('closing steps back to the page, so Forward opens the settings again', async ({
    page,
    visitor,
  }) => {
    await accountButtonOf(page, visitor.email).click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await expect(settingsDialogOf(page)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(settingsDialogOf(page)).toBeHidden();
    await expect(page).toHaveURL('/calendar');

    await page.goForward();
    await expect(settingsDialogOf(page)).toBeVisible();
    await expect(page).toHaveURL('/calendar?settings=account');
  });

  test('after closing what a link opened, ⌘, opens the settings as a step that closing takes back', async ({
    page,
  }) => {
    await page.goto('/shelves?settings=appearance');
    await expect(settingsDialogOf(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL('/shelves');

    await page.keyboard.press('ControlOrMeta+Comma');
    await expect(
      settingsDialogOf(page).getByRole('heading', { name: 'Account' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL('/shelves');

    await page.goForward();
    await expect(settingsDialogOf(page)).toBeVisible();
    await expect(page).toHaveURL('/shelves?settings=account');
  });

  test('a link to the settings opens them over its page, and closing stays there', async ({
    page,
  }) => {
    await page.goto('/shelves?settings=appearance');
    await expect(
      settingsDialogOf(page).getByRole('heading', { name: 'Appearance' }),
    ).toBeVisible();

    await settingsDialogOf(page).getByRole('button', { name: 'Close' }).click();
    await expect(settingsDialogOf(page)).toBeHidden();
    await expect(page).toHaveURL('/shelves');
    await expect(
      page.getByRole('heading', { name: 'Shelves', level: 1 }),
    ).toBeVisible();
  });

  test('the ⌘K palette opens the settings', async ({ page }) => {
    await page.keyboard.press('ControlOrMeta+KeyK');
    await page.keyboard.type('settings');
    await page.keyboard.press('Enter');

    await expect(settingsDialogOf(page)).toBeVisible();
    await expect(page).toHaveURL('/calendar?settings=account');
  });

  test('a name saved in Account shows in the sidebar and stays', async ({
    page,
  }) => {
    await page.keyboard.press('ControlOrMeta+Comma');
    const save = settingsDialogOf(page).getByRole('button', { name: 'Save' });
    await settingsDialogOf(page).getByLabel('Name').fill('Ada Lovelace');
    await save.click();
    await expect(save).toBeDisabled();

    await page.keyboard.press('Escape');
    const sidebarName = page
      .locator('aside')
      .getByRole('button', { name: 'Ada Lovelace' });
    await expect(sidebarName).toBeVisible();

    await page.reload();
    await expect(sidebarName).toBeVisible();
  });

  test('a section page opened directly shows the other sections beside it', async ({
    page,
  }) => {
    await page.goto('/settings/appearance');
    await expect(
      page.getByRole('heading', { name: 'Appearance', level: 1 }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Account' }).click();
    await expect(page).toHaveURL('/settings/account');
    await expect(
      page.getByRole('heading', { name: 'Account', level: 1 }),
    ).toBeVisible();
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: PHONE });

  test('the avatar leads to the settings, and Appearance is a page of its own', async ({
    page,
  }) => {
    await page
      .getByRole('main')
      .getByRole('link', { name: 'Settings' })
      .click();
    await expect(page).toHaveURL('/settings');
    await page.getByRole('link', { name: /^Appearance/ }).click();

    await expect(page).toHaveURL('/settings/appearance');
    await expect(
      page.getByRole('heading', { name: 'Appearance', level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(
      page.getByRole('navigation').getByRole('link', { name: 'Calendar' }),
    ).toBeVisible();

    const saved = actionAnswered(page);
    await page.getByRole('radio', { name: '12 h' }).click();
    await saved;
    await expect(
      page.getByRole('combobox', { name: 'Day ends at' }),
    ).toHaveText(/^4:00\sAM$/);

    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL('/settings');
  });

  test('a theme picked on the Appearance page shows at once and stays', async ({
    page,
  }) => {
    await page.goto('/settings/appearance');
    const saved = actionAnswered(page);
    await page.getByRole('radio', { name: 'Dark' }).click();

    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(18, 18, 20)',
    );
    await saved;
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  test('an unknown section is not found', async ({ page }) => {
    const response = await page.goto('/settings/billing');

    expect(response?.status()).toBe(404);
  });
});
