import { expect, type Locator, type Page } from '@playwright/test';
import type { TiptapEditorHTMLElement } from '@tiptap/core';

import { actionAnswered, signInWithCode, test } from './fixtures';

const PHONE = { width: 390, height: 844 };
const DOC_URL = /\/docs\/[\da-f-]{36}$/;
const SHELF_URL = /\/shelves\/[\da-f-]{36}$/;
const LONG_DOC_LINES = 24;

test.use({ locale: 'en-US', viewport: PHONE, hasTouch: true });

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

function bodyOf(page: Page) {
  return page.getByRole('textbox', { name: 'Doc text' });
}

async function createDocOnANewShelf(page: Page, shelf: string, doc: string) {
  await tabBarOf(page).getByRole('link', { name: 'Shelves' }).click();
  const main = page.getByRole('main');
  await main.getByRole('button', { name: 'New shelf' }).first().click();
  await main.getByRole('textbox', { name: 'Shelf name' }).fill(shelf);
  const answered = actionAnswered(page);
  await page.keyboard.press('Enter');
  await answered;
  await main.getByRole('link', { name: shelf }).click();
  await expect(page).toHaveURL(SHELF_URL);
  await main.getByRole('button', { name: 'New doc' }).click();
  const drawer = page.getByRole('dialog', { name: 'New doc' });
  await drawer.getByRole('textbox', { name: 'Doc title' }).fill(doc);
  await drawer.getByRole('button', { name: 'Create' }).click();
  await expect(page).toHaveURL(DOC_URL);
}

async function untilAutofocusCouldHaveRun(page: Page) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        setTimeout(() => requestAnimationFrame(resolve)),
      ),
  );
}

function isFocused(locator: Locator) {
  return locator.evaluate((element) => element === document.activeElement);
}

function caretBottomOf(body: Locator) {
  return body.evaluate((element: TiptapEditorHTMLElement) => {
    const view = element.editor?.view;
    if (!view) return Number.POSITIVE_INFINITY;
    return view.coordsAtPos(view.state.selection.head).bottom;
  });
}

async function tapJustAboveTheTabBar(page: Page, body: Locator) {
  const { x } = (await body.boundingBox()) ?? { x: 0 };
  const { y } = (await tabBarOf(page).boundingBox()) ?? { y: 0 };
  await page.touchscreen.tap(x + 2, y - 4);
}

test('a new doc waits for a tap, and the text reaches down to the tab bar, so a tap anywhere under it types at its end', async ({
  page,
}) => {
  await createDocOnANewShelf(page, 'Spanish', 'Verbs');
  const body = bodyOf(page);
  await expect(body).toHaveAttribute('aria-placeholder', /^Start/);
  await untilAutofocusCouldHaveRun(page);
  expect(await isFocused(body)).toBe(false);

  await tapJustAboveTheTabBar(page, body);
  await expect(body).toBeFocused();
  await page.keyboard.type('hablo, hablas, habla');
  await page.keyboard.press('Enter');
  await page.keyboard.type('como, comes, come');
  await page.getByRole('textbox', { name: 'Doc title' }).tap();
  await tapJustAboveTheTabBar(page, body);
  await page.keyboard.type(', comemos');

  await expect(body).toBeFocused();
  await expect(body.locator('p')).toHaveText([
    'hablo, hablas, habla',
    'como, comes, come, comemos',
  ]);
});

test('the caret stays above the tab bar while a long doc grows under it', async ({
  page,
}) => {
  await createDocOnANewShelf(page, 'Spanish', 'Verbs');
  const body = bodyOf(page);
  await tapJustAboveTheTabBar(page, body);

  for (let line = 1; line <= LONG_DOC_LINES; line++) {
    await page.keyboard.type(`línea ${String(line)}`);
    await page.keyboard.press('Enter');
  }

  const { y: tabBarTop } = (await tabBarOf(page).boundingBox()) ?? { y: 0 };
  expect(await caretBottomOf(body)).toBeLessThan(tabBarTop);
});

test('a doc lights up the Shelves tab', async ({ page }) => {
  await createDocOnANewShelf(page, 'Spanish', 'Verbs');

  await expect(
    tabBarOf(page).getByRole('link', { name: 'Shelves' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('the back arrows go from a doc to its shelf, then to Shelves', async ({
  page,
}) => {
  await createDocOnANewShelf(page, 'Spanish', 'Verbs');

  await page.getByRole('link', { name: 'Back to Spanish' }).click();
  await expect(page).toHaveURL(SHELF_URL);
  await page.getByRole('link', { name: 'Back to Shelves' }).click();

  await expect(page).toHaveURL('/shelves');
});
