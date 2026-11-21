import { expect, type Locator, type Page } from '@playwright/test';

import { actionAnswered, signInWithCode, test } from './fixtures';

const DOUBLE_CLICK_WAIT_MS = 300;
const DOC_URL = /\/docs\/[\da-f-]{36}$/;

test.use({ locale: 'en-US' });

test.skip(
  ({ browserName, baseURL }) =>
    browserName === 'webkit' && baseURL?.startsWith('http://') === true,
  'WebKit drops the Secure session cookie on plain http, as the local and CI servers are',
);

test.skip(
  ({ isMobile }) => isMobile,
  'The sidebar is for wide screens; phones get the Shelves tab',
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

async function createShelf(page: Page, name: string) {
  const sidebar = sidebarShelvesOf(page);
  await sidebar.getByRole('button', { name: 'New shelf' }).click();
  await sidebar.getByRole('textbox', { name: 'Shelf name' }).fill(name);
  const answered = actionAnswered(page);
  await page.keyboard.press('Enter');
  await answered;
}

async function createDoc(page: Page, shelf: string, title: string) {
  await sidebarShelvesOf(page)
    .getByRole('button', { name: `New doc on ${shelf}` })
    .click();
  const field = page
    .getByRole('dialog', { name: 'New doc' })
    .getByRole('textbox', { name: 'Doc title' });
  await expect(field).toBeFocused();
  await field.fill(title);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(DOC_URL);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
}

async function dragWithMouse(page: Page, from: Locator, to: Locator) {
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) throw new Error('Both rows must be on screen');
  await page.mouse.move(start.x + 10, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + 10, end.y + end.height / 2, { steps: 12 });
  await page.mouse.up();
}

test('makes docs from the + of a shelf row and shows them under it', async ({
  page,
}) => {
  const sidebar = sidebarShelvesOf(page);
  await createShelf(page, 'Spanish');
  await createShelf(page, 'Guitar');

  await createDoc(page, 'Spanish', 'Verbs');
  await createDoc(page, 'Guitar', 'Chords');
  await createDoc(page, 'Spanish', 'Food');

  await expect(namesIn(sidebar)).toHaveText([
    'Spanish',
    'Verbs',
    'Food',
    'Guitar',
    'Chords',
  ]);
  await expect(sidebar.getByRole('link', { name: 'Food' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('moves a doc to another shelf with the mouse, and it stays there after a reload', async ({
  page,
}) => {
  const sidebar = sidebarShelvesOf(page);
  await createShelf(page, 'Spanish');
  await createShelf(page, 'Guitar');
  await createDoc(page, 'Spanish', 'Verbs');
  await createDoc(page, 'Spanish', 'Food');
  await createDoc(page, 'Guitar', 'Chords');
  const docPage = page.url();

  let answered = actionAnswered(page);
  await dragWithMouse(
    page,
    sidebar.getByText('Verbs', { exact: true }),
    sidebar.getByRole('link', { name: 'Guitar' }),
  );
  await answered;
  await expect(namesIn(sidebar)).toHaveText([
    'Spanish',
    'Food',
    'Guitar',
    'Chords',
    'Verbs',
  ]);

  answered = actionAnswered(page);
  await dragWithMouse(
    page,
    sidebar.getByText('Food', { exact: true }),
    sidebar.getByText('Chords', { exact: true }),
  );
  await answered;
  await page.waitForTimeout(2 * DOUBLE_CLICK_WAIT_MS);
  await expect(page).toHaveURL(docPage);

  await page.reload();
  await expect(namesIn(sidebar)).toHaveText([
    'Spanish',
    'Guitar',
    'Food',
    'Chords',
    'Verbs',
  ]);
});

test('reorders docs on a shelf with the mouse without opening the one it drags', async ({
  page,
}) => {
  const sidebar = sidebarShelvesOf(page);
  await createShelf(page, 'Spanish');
  await createDoc(page, 'Spanish', 'Verbs');
  await createDoc(page, 'Spanish', 'Food');
  await page.goto('/calendar');

  const answered = actionAnswered(page);
  await dragWithMouse(
    page,
    sidebar.getByText('Food', { exact: true }),
    sidebar.getByText('Verbs', { exact: true }),
  );
  await answered;
  await page.waitForTimeout(2 * DOUBLE_CLICK_WAIT_MS);
  await expect(page).toHaveURL('/calendar');

  await page.reload();
  await expect(namesIn(sidebar)).toHaveText(['Spanish', 'Food', 'Verbs']);
});

test('folds a shelf away and keeps it folded after a reload', async ({
  page,
}) => {
  const sidebar = sidebarShelvesOf(page);
  await createShelf(page, 'Spanish');
  await createDoc(page, 'Spanish', 'Verbs');

  const toggle = sidebar.getByRole('button', { name: 'Docs on Spanish' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(sidebar.getByRole('link', { name: 'Verbs' })).toBeHidden();

  await page.reload();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(namesIn(sidebar)).toHaveText(['Spanish']);
});

test('renames a doc on a double-click on its title in the tree', async ({
  page,
}) => {
  const sidebar = sidebarShelvesOf(page);
  await createShelf(page, 'Spanish');
  await createDoc(page, 'Spanish', 'Verbs');
  await page.goto('/calendar');

  await sidebar.getByRole('link', { name: 'Verbs' }).dblclick();
  const title = sidebar.getByRole('textbox', { name: 'Doc title' });
  await expect(title).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.type(' to learn');
  const answered = actionAnswered(page);
  await page.keyboard.press('Enter');
  await answered;

  await page.reload();
  await expect(namesIn(sidebar)).toHaveText(['Spanish', 'Verbs to learn']);
});

test('reorders shelves together with their docs', async ({ page }) => {
  const sidebar = sidebarShelvesOf(page);
  await createShelf(page, 'Spanish');
  await createShelf(page, 'Guitar');
  await createDoc(page, 'Spanish', 'Verbs');
  await createDoc(page, 'Guitar', 'Chords');

  const answered = actionAnswered(page);
  await dragWithMouse(
    page,
    sidebar.getByText('Guitar', { exact: true }),
    sidebar.getByText('Spanish', { exact: true }),
  );
  await answered;

  await page.reload();
  await expect(namesIn(sidebar)).toHaveText([
    'Guitar',
    'Chords',
    'Spanish',
    'Verbs',
  ]);
});
