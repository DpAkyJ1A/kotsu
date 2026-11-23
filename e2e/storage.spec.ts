import { expect, type Page } from '@playwright/test';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { userSettings } from '@/server/db/schema/settings';

import { actionAnswered, signInWithCode, test, userIdOf } from './fixtures';

const DOC_URL = /\/docs\/[\da-f-]{36}$/;
const ROOM_FOR_AN_EMPTY_DOC = 1_000;

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

async function setQuota(
  db: NodePgDatabase,
  email: string,
  storageQuotaBytes: number | null,
) {
  await db
    .update(userSettings)
    .set({ storageQuotaBytes })
    .where(eq(userSettings.userId, await userIdOf(db, email)));
}

function sidebarShelvesOf(page: Page) {
  return page.getByRole('navigation', { name: /^shelves$/i });
}

function bodyOf(page: Page) {
  return page.getByRole('textbox', { name: 'Doc text' });
}

function saveStatusOf(page: Page) {
  return page.getByRole('main').getByRole('status');
}

async function createShelf(page: Page, name: string) {
  const sidebar = sidebarShelvesOf(page);
  await sidebar.getByRole('button', { name: 'New shelf' }).click();
  await sidebar.getByRole('textbox', { name: 'Shelf name' }).fill(name);
  const answered = actionAnswered(page);
  await page.keyboard.press('Enter');
  await answered;
}

async function openNewDocForm(page: Page, shelf: string) {
  await sidebarShelvesOf(page)
    .getByRole('button', { name: `New doc on ${shelf}` })
    .click();
  await page
    .getByRole('dialog', { name: 'New doc' })
    .getByRole('textbox', { name: 'Doc title' })
    .fill('Verbs');
  await page.keyboard.press('Enter');
}

async function createDoc(page: Page) {
  await createShelf(page, 'Spanish');
  await openNewDocForm(page, 'Spanish');
  await expect(page).toHaveURL(DOC_URL);
  await expect(bodyOf(page)).toBeFocused();
}

test('Settings → Storage shows the room taken against the quota and the largest shelves and docs', async ({
  page,
  db,
  visitor,
}) => {
  await setQuota(db, visitor.email, 50_000_000);
  await createDoc(page);
  await page.keyboard.type('hablo, hablas, habla');
  await expect(saveStatusOf(page)).toHaveText('Saved');

  await page.keyboard.press('ControlOrMeta+Comma');
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await settings.getByRole('button', { name: 'Storage' }).click();

  await expect(
    settings.getByRole('heading', { name: 'Storage', level: 2 }),
  ).toBeVisible();
  await expect(
    settings.getByRole('meter', { name: 'Storage used' }),
  ).toHaveAttribute('aria-valuetext', /^1\.\d kB of 50 MB$/);
  await expect(settings.getByText('50 MB left')).toBeVisible();
  await expect(
    settings.getByRole('link', { name: /^Spanish 1\.\d kB$/ }),
  ).toBeVisible();

  await settings.getByRole('link', { name: /^Verbs 1\.\d kB$/ }).click();

  await expect(page).toHaveURL(DOC_URL);
  await expect(settings).toBeHidden();
  await expect(bodyOf(page)).toHaveText('hablo, hablas, habla');
});

test('a doc that would pass the quota says the storage is full, keeps its text, and saves once there is room', async ({
  page,
  db,
  visitor,
}) => {
  await setQuota(db, visitor.email, ROOM_FOR_AN_EMPTY_DOC);
  await createDoc(page);
  const docUrl = page.url();

  await page.keyboard.type('hablo, hablas');

  await expect(saveStatusOf(page)).toHaveText('Storage full');
  await expect(
    page.getByText("Storage full — changes aren't saved"),
  ).toBeVisible();

  await page.getByRole('link', { name: 'See what takes space' }).click();
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(
    settings.getByRole('heading', { name: 'Storage', level: 2 }),
  ).toBeVisible();
  await expect(settings.getByText("Full: changes aren't saved")).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(settings).toBeHidden();
  await expect(page).toHaveURL(docUrl);
  await expect(bodyOf(page)).toHaveText('hablo, hablas');

  await setQuota(db, visitor.email, null);
  await bodyOf(page).click();
  await page.keyboard.press('End');
  await page.keyboard.type(', habla');

  await expect(saveStatusOf(page)).toHaveText('Saved');
  await expect(
    page.getByText("Storage full — changes aren't saved"),
  ).toBeHidden();
  await page.reload();
  await expect(bodyOf(page).locator('p').first()).toHaveText(
    'hablo, hablas, habla',
  );
});

test('a new doc that does not fit says the storage is full and stays where it was', async ({
  page,
  db,
  visitor,
}) => {
  await createShelf(page, 'Spanish');
  await setQuota(db, visitor.email, 0);

  await openNewDocForm(page, 'Spanish');

  await expect(
    page.getByText(
      'Your storage is full. Free up space to save more: Settings → Storage.',
    ),
  ).toBeVisible();
  await expect(page).toHaveURL('/calendar');
});
