import { expect, type Page } from '@playwright/test';

import { actionAnswered, signInWithCode, test } from './fixtures';

const PHONE = { width: 390, height: 844 };
const DOC_URL = /\/docs\/[\da-f-]{36}$/;

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

function bodyOf(page: Page) {
  return page.getByRole('textbox', { name: 'Doc text' });
}

function menuOf(page: Page) {
  return page.getByRole('listbox', { name: 'Blocks' });
}

function optionOf(page: Page, label: string) {
  return menuOf(page).getByRole('option', { name: new RegExp(`^${label} `) });
}

async function createDocInTheSidebar(page: Page, shelf: string, doc: string) {
  const sidebar = page.getByRole('navigation', { name: /^shelves$/i });
  await sidebar.getByRole('button', { name: 'New shelf' }).click();
  await sidebar.getByRole('textbox', { name: 'Shelf name' }).fill(shelf);
  const answered = actionAnswered(page);
  await page.keyboard.press('Enter');
  await answered;
  await sidebar.getByRole('button', { name: `New doc on ${shelf}` }).click();
  await page
    .getByRole('dialog', { name: 'New doc' })
    .getByRole('textbox', { name: 'Doc title' })
    .fill(doc);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(DOC_URL);
}

async function createDocInTheShelvesTab(
  page: Page,
  shelf: string,
  doc: string,
) {
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Shelves' })
    .click();
  const main = page.getByRole('main');
  await main.getByRole('button', { name: 'New shelf' }).first().click();
  await main.getByRole('textbox', { name: 'Shelf name' }).fill(shelf);
  const answered = actionAnswered(page);
  await page.keyboard.press('Enter');
  await answered;
  await main.getByRole('link', { name: shelf }).click();
  await main.getByRole('button', { name: 'New doc' }).click();
  await page
    .getByRole('dialog', { name: 'New doc' })
    .getByRole('textbox', { name: 'Doc title' })
    .fill(doc);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(DOC_URL);
}

test('in a new doc, “/h2” and Enter turn the first line into a heading that takes the text typed next', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The sidebar is for wide screens');
  await createDocInTheSidebar(page, 'Spanish', 'Verbs');
  const body = bodyOf(page);
  await expect(body).toBeFocused();

  await page.keyboard.type('/h2');
  await expect(optionOf(page, 'Heading 2')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.keyboard.press('Enter');
  await page.keyboard.type('Present tense');

  await expect(
    body.getByRole('heading', { level: 2, name: 'Present tense' }),
  ).toBeVisible();
  await expect(menuOf(page)).toBeHidden();
  await expect(body).toBeFocused();
});

test.describe('on a phone', () => {
  test.use({ viewport: PHONE, hasTouch: true });

  test('the menu shows whole at the end of a long line, and a tap picks a block', async ({
    page,
  }) => {
    await createDocInTheShelvesTab(page, 'Spanish', 'Verbs');
    const body = bodyOf(page);
    await body.tap();
    await expect(body).toBeFocused();

    await page.keyboard.type('Todos los días hablo un poco más /');

    await expect(menuOf(page)).toBeVisible();
    const box = await menuOf(page).locator('..').boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect(box?.y).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(PHONE.width);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
      PHONE.height,
    );

    await optionOf(page, 'Checklist').tap();
    await page.keyboard.type('Read a page');

    await expect(
      body.getByRole('checkbox', { name: 'Read a page' }),
    ).toBeVisible();
    await expect(body.locator('p').first()).toHaveText(
      'Todos los días hablo un poco más ',
    );
  });
});
