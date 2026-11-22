import { expect, type Locator, type Page } from '@playwright/test';

import { actionAnswered, signInWithCode, test } from './fixtures';

const PHONE = { width: 390, height: 844 };
const UNDO_DELAY_MS = 5_000;
const LONG_PRESS_MS = 400;
const DOUBLE_CLICK_WAIT_MS = 300;
const DOC_URL = /\/docs\/[\da-f-]{36}$/;
const SHELF_URL = /\/shelves\/[\da-f-]{36}$/;

test.use({ locale: 'en-US' });

test.skip(
  ({ browserName, baseURL }) =>
    browserName === 'webkit' && baseURL?.startsWith('http://') === true,
  'WebKit drops the Secure session cookie on plain http, as the local and CI servers are',
);

test.beforeEach(async ({ page, visitor }) => {
  await signInWithCode(page, visitor);
  await expect(page).toHaveURL('/calendar');
});

function sidebarShelvesOf(page: Page) {
  return page.getByRole('navigation', { name: /^shelves$/i });
}

function tilesOf(page: Page) {
  return page.getByRole('main').getByRole('listitem').getByRole('link');
}

async function createShelf(page: Page, name: string) {
  const sidebar = sidebarShelvesOf(page);
  await sidebar.getByRole('button', { name: 'New shelf' }).click();
  await sidebar.getByRole('textbox', { name: 'Shelf name' }).fill(name);
  const answered = actionAnswered(page);
  await page.keyboard.press('Enter');
  await answered;
}

async function openShelf(page: Page, name: string) {
  await sidebarShelvesOf(page).getByRole('link', { name }).click();
  await expect(page).toHaveURL(SHELF_URL);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
}

async function createDoc(page: Page, title: string) {
  await page.getByRole('main').getByRole('button', { name: 'New doc' }).click();
  const form = page.getByRole('dialog', { name: 'New doc' });
  const field = form.getByRole('textbox', { name: 'Doc title' });
  await expect(field).toBeFocused();
  await field.fill(title);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(DOC_URL);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
}

async function createShelfInTheShelvesTab(page: Page, name: string) {
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Shelves' })
    .click();
  const main = page.getByRole('main');
  await main.getByRole('button', { name: 'New shelf' }).first().click();
  await main.getByRole('textbox', { name: 'Shelf name' }).fill(name);
  const answered = actionAnswered(page);
  await page.keyboard.press('Enter');
  await answered;
}

async function pickFromDocMenu(page: Page, doc: string) {
  await page
    .getByRole('main')
    .getByRole('button', { name: `Options for ${doc}` })
    .click();
  return page.getByRole('menu');
}

test.describe('on a wide screen', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'The sidebar and the popover are for wide screens',
  );

  test('creates a doc on a shelf, opens it, and keeps it after a reload', async ({
    page,
  }) => {
    await createShelf(page, 'Spanish');
    await openShelf(page, 'Spanish');
    await expect(page.getByText('Nothing on this shelf yet')).toBeVisible();

    await createDoc(page, 'Verbs');
    await expect(page).toHaveTitle('Verbs · Kotsu');
    const docUrl = page.url();

    await openShelf(page, 'Spanish');
    await expect(tilesOf(page)).toHaveText(['Verbs']);
    await tilesOf(page).first().click();
    await expect(page).toHaveURL(docUrl);

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Verbs');
  });

  test('renames a doc on a double-click on its title, with the caret where the click was', async ({
    page,
  }) => {
    await createShelf(page, 'Spanish');
    await openShelf(page, 'Spanish');
    await createDoc(page, 'Verbs');
    await openShelf(page, 'Spanish');

    const titleText = tilesOf(page).getByText('Verbs');
    const box = await titleText.boundingBox();
    await titleText.dblclick({
      position: { x: 12, y: (box?.height ?? 0) / 2 },
    });
    const title = page.getByRole('main').getByRole('textbox', {
      name: 'Doc title',
    });
    await expect(title).toBeFocused();
    const [start, end] = await title.evaluate((input: HTMLInputElement) => [
      input.selectionStart ?? -1,
      input.selectionEnd ?? -1,
    ]);
    expect(start).toBe(end);
    expect(start).toBeGreaterThan(0);
    expect(start).toBeLessThan('Verbs'.length);
    await page.waitForTimeout(2 * DOUBLE_CLICK_WAIT_MS);
    await expect(page).toHaveURL(SHELF_URL);
    await expect(title).toBeFocused();
    await page.keyboard.press('End');
    await page.keyboard.type(' to know');
    const answered = actionAnswered(page);
    await page.keyboard.press('Enter');
    await answered;

    await page.reload();
    await expect(page).toHaveURL(SHELF_URL);
    await expect(tilesOf(page)).toHaveText(['Verbs to know']);
  });

  test('opens a doc a moment after a click on its title, at once on a click beside it, and in a new tab on a ⌘-click', async ({
    page,
  }) => {
    await page.clock.install();
    await page.reload();
    await createShelf(page, 'Spanish');
    await openShelf(page, 'Spanish');
    await createDoc(page, 'Verbs');
    const docUrl = page.url();
    await openShelf(page, 'Spanish');
    const titleText = tilesOf(page).getByText('Verbs');

    const tab = page.context().waitForEvent('page');
    await titleText.click({ modifiers: ['ControlOrMeta'] });
    await expect(await tab).toHaveURL(docUrl);
    await expect(page).toHaveURL(SHELF_URL);

    await titleText.click();
    await expect(page).toHaveURL(docUrl);

    await openShelf(page, 'Spanish');
    await page.clock.pauseAt(Date.now() + 1_000);
    await tilesOf(page).click({ position: { x: 8, y: 8 } });
    await expect(page).toHaveURL(docUrl);
  });

  test('renames a doc, moves it to the end of another shelf and deletes it after five seconds', async ({
    page,
  }) => {
    await page.clock.install();
    await page.reload();
    await createShelf(page, 'Spanish');
    await createShelf(page, 'Guitar');
    await openShelf(page, 'Guitar');
    await createDoc(page, 'Chords');
    await openShelf(page, 'Spanish');
    await createDoc(page, 'Verbs');
    await openShelf(page, 'Spanish');

    let menu = await pickFromDocMenu(page, 'Verbs');
    await menu.getByRole('menuitem', { name: 'Rename' }).click();
    const title = page.getByRole('main').getByRole('textbox', {
      name: 'Doc title',
    });
    await expect(title).toBeFocused();
    await title.fill('Irregular verbs');
    let answered = actionAnswered(page);
    await page.keyboard.press('Enter');
    await answered;

    menu = await pickFromDocMenu(page, 'Irregular verbs');
    answered = actionAnswered(page);
    await menu.getByRole('menuitemradio', { name: 'Guitar' }).click();
    await answered;
    await expect(tilesOf(page)).toHaveCount(0);

    await openShelf(page, 'Guitar');
    await page.reload();
    await expect(tilesOf(page)).toHaveText(['Chords', 'Irregular verbs']);

    menu = await pickFromDocMenu(page, 'Chords');
    await menu.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(tilesOf(page)).toHaveText(['Irregular verbs']);
    answered = actionAnswered(page);
    await page.clock.fastForward(UNDO_DELAY_MS);
    await answered;

    await page.reload();
    await expect(tilesOf(page)).toHaveText(['Irregular verbs']);
  });

  test('deletes a shelf with docs only once its name is typed, and leaves the page of one of its docs', async ({
    page,
  }) => {
    await page.clock.install();
    await page.reload();
    await createShelf(page, 'Spanish');
    await createShelf(page, 'Guitar');
    await openShelf(page, 'Spanish');
    await createDoc(page, 'Verbs');
    await openShelf(page, 'Spanish');
    await createDoc(page, 'Kitchen & food');
    const docUrl = page.url();

    const sidebar = sidebarShelvesOf(page);
    await sidebar.getByRole('button', { name: 'Options for Spanish' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete Spanish?' });
    await expect(dialog.getByRole('listitem')).toHaveText([
      'Verbs',
      'Kitchen & food',
    ]);
    const confirm = dialog.getByRole('button', { name: 'Delete shelf' });
    await expect(confirm).toBeDisabled();
    await dialog
      .getByRole('textbox', { name: 'Type Spanish to confirm' })
      .fill('Spanish');
    await confirm.click();

    await expect(page).toHaveURL('/shelves');
    await expect(sidebar.getByRole('link')).toHaveText(['Guitar']);
    const answered = actionAnswered(page);
    await page.clock.fastForward(UNDO_DELAY_MS);
    await answered;

    await page.reload();
    await expect(sidebar.getByRole('link')).toHaveText(['Guitar']);
    await page.goto(docUrl);
    await expect(page.getByText('This page could not be found.')).toBeVisible();
  });

  test('reorders docs with the mouse without opening the one it drags, and keeps the order after a reload', async ({
    page,
  }) => {
    await createShelf(page, 'Spanish');
    for (const title of ['Verbs', 'Food', 'Travel']) {
      await openShelf(page, 'Spanish');
      await createDoc(page, title);
    }
    await openShelf(page, 'Spanish');
    const shelf = page.url();
    const main = page.getByRole('main');

    const answered = actionAnswered(page);
    await dragAcross(
      page,
      main.getByText('Travel', { exact: true }),
      main.getByText('Verbs', { exact: true }),
    );
    await answered;
    await page.waitForTimeout(2 * DOUBLE_CLICK_WAIT_MS);
    await expect(page).toHaveURL(shelf);

    await page.reload();
    await expect(tilesOf(page)).toHaveText(['Travel', 'Verbs', 'Food']);
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: PHONE, hasTouch: true });

  test('creates a doc from a drawer with the title field ready', async ({
    page,
  }) => {
    const main = page.getByRole('main');
    await createShelfInTheShelvesTab(page, 'Spanish');
    await main.getByRole('link', { name: 'Spanish' }).click();
    await expect(page).toHaveURL(SHELF_URL);

    await main.getByRole('button', { name: 'New doc' }).click();
    const drawer = page.getByRole('dialog', { name: 'New doc' });
    await expect(
      drawer.getByRole('textbox', { name: 'Doc title' }),
    ).toBeFocused();
    await page.keyboard.type('Verbs');
    await drawer.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(DOC_URL);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Verbs');
    await page.getByRole('link', { name: 'Back to Spanish' }).click();
    await expect(page).toHaveURL(SHELF_URL);
    await expect(main.getByRole('link', { name: 'Verbs' })).toBeVisible();
  });

  test('opens a doc at once on a tap on its title', async ({ page }) => {
    await page.clock.install();
    await page.reload();
    const main = page.getByRole('main');
    await createShelfInTheShelvesTab(page, 'Spanish');
    await main.getByRole('link', { name: 'Spanish' }).click();
    await createDoc(page, 'Verbs');
    await page.getByRole('link', { name: 'Back to Spanish' }).click();
    await expect(page).toHaveURL(SHELF_URL);

    await page.clock.pauseAt(Date.now() + 1_000);
    await main.getByRole('link', { name: 'Verbs' }).getByText('Verbs').tap();
    await expect(page).toHaveURL(DOC_URL);
  });

  test('a long press picks a doc up and moves it', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'The long press goes through Chromium touch events',
    );
    const main = page.getByRole('main');
    await createShelfInTheShelvesTab(page, 'Spanish');
    await main.getByRole('link', { name: 'Spanish' }).click();
    await expect(page).toHaveURL(SHELF_URL);
    for (const title of ['Verbs', 'Food', 'Travel']) {
      await createDoc(page, title);
      await page.getByRole('link', { name: 'Back to Spanish' }).click();
      await expect(page).toHaveURL(SHELF_URL);
    }

    const answered = actionAnswered(page);
    await longPressAndDrag(
      page,
      main.getByRole('link', { name: 'Travel' }),
      main.getByRole('link', { name: 'Verbs' }),
    );
    await answered;

    await page.reload();
    await expect(tilesOf(page)).toHaveText(['Travel', 'Verbs', 'Food']);
  });
});

async function dragAcross(page: Page, from: Locator, to: Locator) {
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) throw new Error('Both tiles must be on screen');
  await page.mouse.move(start.x + 5, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + 5, end.y + end.height / 2, { steps: 12 });
  await page.mouse.up();
}

async function longPressAndDrag(page: Page, from: Locator, to: Locator) {
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) throw new Error('Both tiles must be on screen');
  const cdp = await page.context().newCDPSession(page);
  const touch = (
    type: 'touchStart' | 'touchMove' | 'touchEnd',
    point?: { x: number; y: number },
  ) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: point ? [point] : [],
    });
  const startAt = { x: start.x + 20, y: start.y + start.height / 2 };
  const endAt = { x: end.x + 20, y: end.y + end.height / 2 };

  await touch('touchStart', startAt);
  await page.waitForTimeout(LONG_PRESS_MS);
  for (let step = 1; step <= 10; step++) {
    await touch('touchMove', {
      x: startAt.x + ((endAt.x - startAt.x) * step) / 10,
      y: startAt.y + ((endAt.y - startAt.y) * step) / 10,
    });
  }
  await touch('touchEnd');
}
