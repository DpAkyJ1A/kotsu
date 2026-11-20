import { expect, type Locator, type Page } from '@playwright/test';
import { v7 as uuidv7 } from 'uuid';

import { actionAnswered, signInWithCode, test } from './fixtures';

const PHONE = { width: 390, height: 844 };
const UNDO_DELAY_MS = 5_000;
const LONG_PRESS_MS = 400;
const DOUBLE_CLICK_WAIT_MS = 300;
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

function namesIn(list: Locator) {
  return list.getByRole('listitem').getByRole('link');
}

async function createShelf(page: Page, list: Locator, name: string) {
  await list.getByRole('button', { name: 'New shelf' }).click();
  await list.getByRole('textbox', { name: 'Shelf name' }).fill(name);
  const answered = actionAnswered(page);
  await page.keyboard.press('Enter');
  await answered;
}

async function pickFromMenu(page: Page, list: Locator, shelf: string) {
  await list.getByRole('button', { name: `Options for ${shelf}` }).click();
  return page.getByRole('menu');
}

async function dragWithMouse(page: Page, from: Locator, to: Locator) {
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) throw new Error('Both shelves must be on screen');
  await page.mouse.move(start.x + 20, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + 20, end.y + 2, { steps: 12 });
  await page.mouse.up();
}

test.describe('in the sidebar', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'The sidebar is for wide screens; phones get the Shelves tab',
  );

  test('makes, renames, recolours and reorders shelves, which stay after a reload', async ({
    page,
  }) => {
    const sidebar = sidebarShelvesOf(page);
    for (const name of ['Spanish', 'Guitar', 'Running']) {
      await createShelf(page, sidebar, name);
    }

    const guitarMenu = await pickFromMenu(page, sidebar, 'Guitar');
    await guitarMenu.getByRole('menuitem', { name: 'Rename' }).click();
    const name = sidebar.getByRole('textbox', { name: 'Shelf name' });
    await expect(name).toBeFocused();
    await name.fill('Classical guitar');
    let answered = actionAnswered(page);
    await page.keyboard.press('Enter');
    await answered;

    const runningMenu = await pickFromMenu(page, sidebar, 'Running');
    answered = actionAnswered(page);
    await runningMenu.getByRole('menuitemradio', { name: 'Teal' }).click();
    await answered;
    await page.keyboard.press('Escape');

    answered = actionAnswered(page);
    await dragWithMouse(
      page,
      sidebar.getByRole('link', { name: 'Running' }),
      sidebar.getByRole('link', { name: 'Spanish' }),
    );
    await answered;
    await expect(page).toHaveURL('/calendar');

    await page.reload();
    await expect(namesIn(sidebar)).toHaveText([
      'Running',
      'Spanish',
      'Classical guitar',
    ]);
    const menu = await pickFromMenu(page, sidebar, 'Running');
    await expect(
      menu.getByRole('menuitemradio', { name: 'Teal' }),
    ).toBeChecked();
  });

  test('renames a shelf on a double-click, with a caret and no selection', async ({
    page,
  }) => {
    const sidebar = sidebarShelvesOf(page);
    await createShelf(page, sidebar, 'Spanish');

    await sidebar.getByRole('link', { name: 'Spanish' }).dblclick();
    const name = sidebar.getByRole('textbox', { name: 'Shelf name' });
    await expect(name).toBeFocused();
    const selection = await name.evaluate((input: HTMLInputElement) => [
      input.selectionStart,
      input.selectionEnd,
    ]);
    expect(selection[0]).toBe(selection[1]);

    await page.keyboard.press('End');
    await page.keyboard.type(' B1');
    const answered = actionAnswered(page);
    await page.keyboard.press('Enter');
    await answered;

    await page.reload();
    await expect(namesIn(sidebar)).toHaveText(['Spanish B1']);
  });

  test('deletes a shelf five seconds after Delete, unless Undo comes first', async ({
    page,
  }) => {
    await page.clock.install();
    await page.reload();
    const sidebar = sidebarShelvesOf(page);
    await createShelf(page, sidebar, 'Spanish');
    await createShelf(page, sidebar, 'Guitar');

    let menu = await pickFromMenu(page, sidebar, 'Guitar');
    await menu.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(namesIn(sidebar)).toHaveText(['Spanish']);
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(namesIn(sidebar)).toHaveText(['Spanish', 'Guitar']);
    await page.clock.fastForward(UNDO_DELAY_MS);
    await page.reload();
    await expect(namesIn(sidebar)).toHaveText(['Spanish', 'Guitar']);

    menu = await pickFromMenu(page, sidebar, 'Guitar');
    await menu.getByRole('menuitem', { name: 'Delete' }).click();
    const answered = actionAnswered(page);
    await page.clock.fastForward(UNDO_DELAY_MS);
    await answered;
    await expect(page.getByRole('button', { name: 'Undo' })).toBeHidden();

    await page.reload();
    await expect(namesIn(sidebar)).toHaveText(['Spanish']);
  });

  test('opens a shelf, and leaves its page when the shelf is deleted', async ({
    page,
  }) => {
    const sidebar = sidebarShelvesOf(page);
    await createShelf(page, sidebar, 'Spanish');

    await sidebar.getByRole('link', { name: 'Spanish' }).click();
    await expect(page).toHaveURL(/\/shelves\/[\da-f-]{36}$/);
    await expect(page).toHaveTitle('Spanish · Kotsu');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Spanish' }),
    ).toBeVisible();
    await expect(
      sidebar.getByRole('link', { name: 'Spanish' }),
    ).toHaveAttribute('aria-current', 'page');

    const menu = await pickFromMenu(page, sidebar, 'Spanish');
    await menu.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(page).toHaveURL('/shelves');
  });

  test('opens a shelf at once on a click on its name', async ({ page }) => {
    await page.clock.install();
    await page.reload();
    const sidebar = sidebarShelvesOf(page);
    await createShelf(page, sidebar, 'Spanish');

    await page.clock.pauseAt(Date.now() + 1_000);
    await sidebar.getByRole('link', { name: 'Spanish' }).click();
    await expect(page).toHaveURL(SHELF_URL);
  });
});

test.describe('on the Shelves page of a wide screen', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'Phones open a shelf on a tap and rename it from its ⋯ menu',
  );

  test('renames a shelf on a double-click on its name, with the caret where the click was', async ({
    page,
  }) => {
    await createShelf(page, sidebarShelvesOf(page), 'Spanish');
    await page.goto('/shelves');
    const main = page.getByRole('main');

    const nameText = main.getByText('Spanish', { exact: true });
    const box = await nameText.boundingBox();
    await nameText.dblclick({
      position: { x: 12, y: (box?.height ?? 0) / 2 },
    });
    const name = main.getByRole('textbox', { name: 'Shelf name' });
    await expect(name).toBeFocused();
    const [start, end] = await name.evaluate((input: HTMLInputElement) => [
      input.selectionStart ?? -1,
      input.selectionEnd ?? -1,
    ]);
    expect(start).toBe(end);
    expect(start).toBeGreaterThan(0);
    expect(start).toBeLessThan('Spanish'.length);
    await page.waitForTimeout(2 * DOUBLE_CLICK_WAIT_MS);
    await expect(page).toHaveURL('/shelves');
    await expect(name).toBeFocused();
    await page.keyboard.press('End');
    await page.keyboard.type(' B1');
    const answered = actionAnswered(page);
    await page.keyboard.press('Enter');
    await answered;

    await page.reload();
    await expect(namesIn(main)).toHaveText(['Spanish B1']);
  });

  test('opens a shelf a moment after a click on its name, and at once on a click beside it', async ({
    page,
  }) => {
    await page.clock.install();
    await page.reload();
    await createShelf(page, sidebarShelvesOf(page), 'Spanish');
    await page.goto('/shelves');
    const main = page.getByRole('main');
    await page.clock.pauseAt(Date.now() + 1_000);

    await main.getByText('Spanish', { exact: true }).click();
    await page.waitForTimeout(2 * DOUBLE_CLICK_WAIT_MS);
    await expect(page).toHaveURL('/shelves');
    await page.clock.runFor(DOUBLE_CLICK_WAIT_MS);
    await expect(page).toHaveURL(SHELF_URL);

    await page.goBack();
    await main
      .getByRole('link', { name: 'Spanish' })
      .click({ position: { x: 8, y: 8 } });
    await expect(page).toHaveURL(SHELF_URL);
  });

  test('reorders shelves with the mouse without opening the one it drags', async ({
    page,
  }) => {
    const sidebar = sidebarShelvesOf(page);
    await createShelf(page, sidebar, 'Spanish');
    await createShelf(page, sidebar, 'Guitar');
    await page.goto('/shelves');
    const main = page.getByRole('main');

    const guitar = await main
      .getByText('Guitar', { exact: true })
      .boundingBox();
    if (!guitar) throw new Error('Guitar must be on screen');
    await page.mouse.move(guitar.x + 20, guitar.y + guitar.height / 2);
    await page.mouse.down();
    await page.mouse.move(guitar.x + 20, guitar.y + guitar.height / 2 + 10, {
      steps: 5,
    });
    await page.mouse.move(guitar.x + 20, guitar.y + guitar.height / 2, {
      steps: 5,
    });
    await page.mouse.up();
    await page.waitForTimeout(2 * DOUBLE_CLICK_WAIT_MS);
    await expect(page).toHaveURL('/shelves');

    const answered = actionAnswered(page);
    await dragWithMouse(
      page,
      main.getByText('Guitar', { exact: true }),
      main.getByRole('link', { name: 'Spanish' }),
    );
    await answered;
    await page.waitForTimeout(2 * DOUBLE_CLICK_WAIT_MS);
    await expect(page).toHaveURL('/shelves');

    await page.reload();
    await expect(namesIn(main)).toHaveText(['Guitar', 'Spanish']);
  });
});

test("shows no page for a shelf that isn't the user's", async ({ page }) => {
  await page.goto(`/shelves/${uuidv7()}`);

  await expect(page.getByText('This page could not be found.')).toBeVisible();
});

test.describe('on a phone', () => {
  test.use({ viewport: PHONE, hasTouch: true });

  async function openShelvesTab(page: Page) {
    await page
      .getByRole('navigation')
      .getByRole('link', { name: 'Shelves' })
      .click();
    return page.getByRole('main');
  }

  async function createOnTab(page: Page, main: Locator, name: string) {
    await main.getByRole('button', { name: 'New shelf' }).first().click();
    await main.getByRole('textbox', { name: 'Shelf name' }).fill(name);
    const answered = actionAnswered(page);
    await page.keyboard.press('Enter');
    await answered;
  }

  test('the Shelves tab starts empty and makes shelves', async ({ page }) => {
    const main = await openShelvesTab(page);
    await expect(main.getByText('No shelves yet')).toBeVisible();

    await createOnTab(page, main, 'Spanish');
    await createOnTab(page, main, 'Guitar');

    await page.reload();
    await expect(namesIn(main)).toHaveText(['Spanish', 'Guitar']);
  });

  test('a long press picks a shelf up and moves it', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'The long press goes through Chromium touch events',
    );
    const main = await openShelvesTab(page);
    await createOnTab(page, main, 'Spanish');
    await createOnTab(page, main, 'Guitar');

    const answered = actionAnswered(page);
    await longPressAndDrag(
      page,
      main.getByRole('link', { name: 'Guitar' }),
      main.getByRole('link', { name: 'Spanish' }),
    );
    await answered;

    await page.reload();
    await expect(namesIn(main)).toHaveText(['Guitar', 'Spanish']);
  });
});

async function longPressAndDrag(page: Page, from: Locator, to: Locator) {
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) throw new Error('Both shelves must be on screen');
  const cdp = await page.context().newCDPSession(page);
  const x = start.x + 40;
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', y?: number) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: y === undefined ? [] : [{ x, y }],
    });

  await touch('touchStart', start.y + start.height / 2);
  await page.waitForTimeout(LONG_PRESS_MS);
  for (let step = 1; step <= 10; step++) {
    const y = start.y + start.height / 2 + ((end.y + 2 - start.y) * step) / 10;
    await touch('touchMove', y);
  }
  await touch('touchEnd');
}
