import { expect, type Locator, type Page } from '@playwright/test';

import { signInWithCode, test } from './fixtures';

const PHONE = { width: 390, height: 844 };
const SMALL_TABLET = { width: 744, height: 1133 };
const DESKTOP = { width: 1440, height: 900 };

test.use({ locale: 'en-US', viewport: PHONE });

test.skip(
  ({ browserName, baseURL }) =>
    browserName === 'webkit' && baseURL?.startsWith('http://') === true,
  'WebKit drops the Secure session cookie on plain http, as the local and CI servers are',
);

test.beforeEach(async ({ page, visitor }) => {
  await signInWithCode(page, visitor);
  await expect(page).toHaveURL('/calendar');
});

function tabBarOf(page: Page) {
  return page.getByRole('navigation');
}

function avatarButtonOf(page: Page, email: string) {
  const [emailName = ''] = email.split('@');
  return page.getByRole('main').getByRole('button', { name: emailName });
}

function edgesOf(locator: Locator) {
  return locator.evaluate((element) => {
    const { top, bottom } = element.getBoundingClientRect();
    return { top, bottom };
  });
}

test('the tab bar moves between the sections', async ({ page }) => {
  const tabBar = tabBarOf(page);
  await expect(tabBar.getByRole('link', { name: 'Calendar' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  for (const [name, path] of [
    ['Shelves', '/shelves'],
    ['Practice', '/practice'],
    ['Clock', '/clock'],
    ['Search', '/search'],
  ] as const) {
    await tabBar.getByRole('link', { name }).click();

    await expect(page).toHaveURL(path);
    await expect(page).toHaveTitle(`${name} · Kotsu`);
    await expect(tabBar.getByRole('link', { name })).toHaveAttribute(
      'aria-current',
      'page',
    );
  }
});

test('the tab bar stays at the bottom of the screen on a long page', async ({
  page,
}) => {
  expect((await edgesOf(tabBarOf(page))).bottom).toBe(PHONE.height);

  await page.getByRole('main').evaluate((main) => {
    const filler = document.createElement('div');
    filler.style.height = '300vh';
    main.append(filler);
  });
  await page.evaluate(() => {
    window.scrollTo(0, window.innerHeight);
  });

  expect((await edgesOf(tabBarOf(page))).bottom).toBe(PHONE.height);
});

test('the layout follows the width of the window', async ({ page }) => {
  await expect(tabBarOf(page)).toBeVisible();
  await expect(page.locator('aside')).toBeHidden();

  await page.setViewportSize(DESKTOP);

  await expect(page.locator('aside')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Search' })).toBeHidden();
});

test('⌘\\ or Ctrl+\\ on a narrow window leaves the sidebar as it was', async ({
  page,
}) => {
  await page.keyboard.press('ControlOrMeta+Backslash');

  await page.setViewportSize(DESKTOP);
  await expect(page.locator('aside')).toBeVisible();
});

test('signs out from the menu under the avatar', async ({ page, visitor }) => {
  await avatarButtonOf(page, visitor.email).click();
  await expect(page.getByRole('menu')).toContainText(visitor.email);
  await page.getByRole('menuitem', { name: 'Sign out' }).click();

  await expect(page).toHaveURL('/sign-in');
});

for (const viewport of [PHONE, SMALL_TABLET]) {
  test(`a toast shows above the tab bar ${String(viewport.width)}px wide`, async ({
    page,
    visitor,
  }) => {
    await page.setViewportSize(viewport);
    await page.route('**/api/auth/sign-out', (route) => route.abort());

    await avatarButtonOf(page, visitor.email).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    const toast = page.locator('[data-sonner-toast]', {
      hasText: 'Something went wrong. Try again.',
    });
    await expect(toast).toHaveCSS('opacity', '1');
    const { bottom: toastBottom } = await edgesOf(toast);
    const { top: tabBarTop } = await edgesOf(tabBarOf(page));
    expect(toastBottom).toBeLessThan(tabBarTop);
  });
}
