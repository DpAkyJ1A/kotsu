import { expect, type Page, type Request } from '@playwright/test';

import { actionAnswered, signInWithCode, test } from './fixtures';

const DOC_URL = /\/docs\/[\da-f-]{36}$/;
const MISSING_DOC_ID = '019a9c3e-0000-7000-8000-000000000000';

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

async function pickInTheAccountMenu(page: Page, email: string, option: string) {
  const [emailName = ''] = email.split('@');
  await page.getByRole('button', { name: emailName, exact: true }).click();
  const saved = actionAnswered(page);
  await page.getByRole('menuitemradio', { name: option }).click();
  await saved;
  await page.keyboard.press('Escape');
}

function sidebarShelvesOf(page: Page) {
  return page.getByRole('navigation', { name: /^shelves$/i });
}

function isAction(request: Request) {
  return request.headers()['next-action'] !== undefined;
}

function titleOf(page: Page) {
  return page.getByRole('main').getByRole('textbox', { name: 'Doc title' });
}

function bodyOf(page: Page) {
  return page.getByRole('textbox', { name: 'Doc text' });
}

async function createDocOnANewShelf(page: Page, shelf: string, doc: string) {
  const sidebar = sidebarShelvesOf(page);
  await sidebar.getByRole('button', { name: 'New shelf' }).click();
  await sidebar.getByRole('textbox', { name: 'Shelf name' }).fill(shelf);
  const answered = actionAnswered(page);
  await page.keyboard.press('Enter');
  await answered;
  await createDoc(page, shelf, doc);
}

async function createDoc(page: Page, shelf: string, doc: string) {
  await sidebarShelvesOf(page)
    .getByRole('button', { name: `New doc on ${shelf}` })
    .click();
  await page
    .getByRole('dialog', { name: 'New doc' })
    .getByRole('textbox', { name: 'Doc title' })
    .fill(doc);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(DOC_URL);
  await expect(titleOf(page)).toHaveValue(doc);
}

test('a new doc opens with the caret in its text, and Markdown turns into blocks as you type', async ({
  page,
}) => {
  await createDocOnANewShelf(page, 'Spanish', 'Verbs');
  const body = bodyOf(page);
  await expect(body).toBeFocused();

  await page.keyboard.type('# Present tense');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Regular verbs end in **-ar** or `-er` ');
  await page.keyboard.press('Enter');
  await page.keyboard.type('- hablo');
  await page.keyboard.press('Enter');
  await page.keyboard.type('hablas');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('[] Conjugate ten verbs');

  await expect(
    body.getByRole('heading', { level: 1, name: 'Present tense' }),
  ).toBeVisible();
  await expect(body.locator('strong')).toHaveText('-ar');
  await expect(body.locator('p > code')).toHaveText('-er');
  await expect(body.getByRole('listitem')).toHaveText([
    'hablo',
    'hablas',
    /Conjugate ten verbs$/,
  ]);
  await expect(
    body.getByRole('checkbox', { name: 'Conjugate ten verbs' }),
  ).not.toBeChecked();
});

test('a mouse click anywhere under the text, down to the bottom of the window, puts the caret at its end', async ({
  page,
}) => {
  await createDocOnANewShelf(page, 'Spanish', 'Verbs');
  const body = bodyOf(page);
  await expect(body).toBeFocused();
  await page.keyboard.type('hablo, hablas, habla');
  await page.keyboard.press('Enter');
  await page.keyboard.type('como, comes, come');
  await titleOf(page).click();

  const { x } = (await body.boundingBox()) ?? { x: 0 };
  const { height } = page.viewportSize() ?? { height: 0 };
  await page.mouse.click(x + 2, height - 4);
  await page.keyboard.type(', comemos');

  await expect(body).toBeFocused();
  await expect(body.locator('p')).toHaveText([
    'hablo, hablas, habla',
    'como, comes, come, comemos',
  ]);
});

test('renaming the doc in its title shows the new title in the sidebar and the breadcrumb, and keeps it', async ({
  page,
}) => {
  await createDocOnANewShelf(page, 'Spanish', 'Verbs');
  const title = titleOf(page);
  await expect(title).toHaveValue('Verbs');

  await title.click();
  await page.keyboard.press('End');
  const saved = actionAnswered(page);
  await page.keyboard.type(' in the present');
  await saved;

  await expect(
    sidebarShelvesOf(page).getByRole('link', { name: 'Verbs in the present' }),
  ).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveText(
    /Spanish\s*Verbs in the present/,
  );
  await expect(title).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(bodyOf(page)).toBeFocused();

  await page.reload();
  await expect(title).toHaveValue('Verbs in the present');
  await expect(page).toHaveTitle('Verbs in the present · Kotsu');
});

test('opening another doc from the sidebar shows that doc, not the text typed in the one before', async ({
  page,
}) => {
  await createDocOnANewShelf(page, 'Spanish', 'Verbs');
  await createDoc(page, 'Spanish', 'Food');
  await sidebarShelvesOf(page).getByRole('link', { name: 'Verbs' }).click();
  await expect(titleOf(page)).toHaveValue('Verbs');
  await bodyOf(page).click();
  await page.keyboard.type('hablo, hablas');
  await expect(bodyOf(page)).toHaveText('hablo, hablas');

  await sidebarShelvesOf(page).getByRole('link', { name: 'Food' }).click();

  await expect(titleOf(page)).toHaveValue('Food');
  await expect(bodyOf(page)).toHaveText('');
  await expect(bodyOf(page)).toHaveAttribute('aria-placeholder', /^Start/);
});

test('a language picked in the menu while a doc is open speaks it in the doc at once', async ({
  page,
  visitor,
}) => {
  await createDocOnANewShelf(page, 'Spanish', 'Verbs');
  await expect(bodyOf(page)).toBeFocused();

  await pickInTheAccountMenu(page, visitor.email, 'Русский');

  const body = page.getByRole('textbox', { name: 'Текст дока' });
  await expect(body).toHaveAttribute('aria-placeholder', /^Начни писать/);
  await expect(body.locator('p')).toHaveAttribute(
    'data-placeholder',
    /^Начни писать/,
  );
  await expect(
    page.getByRole('main').getByRole('textbox', { name: 'Название дока' }),
  ).toHaveValue('Verbs');
  await expect(
    page.getByRole('navigation', { name: 'Навигационная цепочка' }),
  ).toHaveText(/Spanish\s*Verbs/);
  await body.click();
  await page.keyboard.type('[] ');
  await expect(
    body.getByRole('checkbox', { name: 'Пустой пункт чеклиста' }),
  ).toBeVisible();
});

test('a rename waits for the one before it, so a slow first save cannot land after a later one', async ({
  page,
}) => {
  await createDocOnANewShelf(page, 'Spanish', 'Verbs');
  let isFirstHeld = false;
  await page.route(DOC_URL, async (route) => {
    if (!isFirstHeld && isAction(route.request())) {
      isFirstHeld = true;
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
    await route.fallback();
  });
  const renames: string[] = [];
  page.on('request', (request) => {
    if (isAction(request)) renames.push('sent');
  });
  page.on('response', (response) => {
    if (isAction(response.request())) renames.push('answered');
  });
  const title = titleOf(page);
  await title.click();
  await page.keyboard.press('End');

  const firstSent = page.waitForRequest(isAction);
  await page.keyboard.type(' in the');
  await firstSent;
  await page.keyboard.type(' present');
  await page.keyboard.press('Enter');

  await expect
    .poll(() => renames, { timeout: 10_000 })
    .toEqual(['sent', 'answered', 'sent', 'answered']);
  await page.reload();
  await expect(title).toHaveValue('Verbs in the present');
});

test('a doc that is not there, or not a doc id at all, is not found', async ({
  page,
}) => {
  for (const id of [MISSING_DOC_ID, 'verbs']) {
    const response = await page.goto(`/docs/${id}`);
    expect(response?.status()).toBe(404);
  }
});
