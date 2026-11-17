import { type BrowserContext, expect, type Page } from '@playwright/test';
import { eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { session, user } from '@/server/db/schema/auth';

import { signInWithCode, test } from './fixtures';

test.use({ locale: 'en-US' });

const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_DAYS = 7;

test.skip(
  ({ browserName, baseURL }) =>
    browserName === 'webkit' && baseURL?.startsWith('http://') === true,
  'WebKit drops the Secure session cookie on plain http, as the local and CI servers are',
);
test.skip(
  ({ isMobile }) => isMobile,
  'The sidebar is for wide screens; phones get a tab bar in task 0.18',
);

test.beforeEach(async ({ page, visitor }) => {
  await signInWithCode(page, visitor);
  await expect(page).toHaveURL('/calendar');
});

function sidebarOf(page: Page) {
  return page.locator('aside');
}

function accountButtonOf(page: Page, email: string) {
  const [emailName = ''] = email.split('@');
  return sidebarOf(page).getByRole('button', { name: emailName });
}

function closeButtonOf(page: Page) {
  return sidebarOf(page).getByRole('button', { name: 'Close sidebar' });
}

type Point = { x: number; y: number };

async function restPointerAt(page: Page, { x, y }: Point, ms: number) {
  for (let end = Date.now() + ms, step = 0; Date.now() < end; step += 1) {
    await page.mouse.move(x + (step % 2), y);
  }
}

function openButtonOf(page: Page) {
  return page.getByRole('main').getByRole('button', { name: 'Open sidebar' });
}

async function sessionCookie(context: BrowserContext) {
  const cookies = await context.cookies();
  const cookie = cookies.find(({ name }) => name.endsWith('session_token'));
  if (!cookie) throw new Error('No session cookie');
  return cookie;
}

type SessionAge = {
  db: NodePgDatabase;
  context: BrowserContext;
  email: string;
  expiresAt: Date;
};

async function ageSession({ db, context, email, expiresAt }: SessionAge) {
  const owner = db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email));
  await db
    .update(session)
    .set({ expiresAt })
    .where(inArray(session.userId, owner));
  const cookie = await sessionCookie(context);
  await context.addCookies([
    { ...cookie, expires: expiresAt.getTime() / 1000 },
  ]);
}

test('the sidebar moves between the sections', async ({ page }) => {
  const sidebar = sidebarOf(page);
  await expect(sidebar.getByRole('link', { name: 'Calendar' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await sidebar.getByRole('link', { name: 'Practice' }).click();

  await expect(page).toHaveURL('/practice');
  await expect(page).toHaveTitle('Practice · Kotsu');
  await expect(
    page.getByRole('heading', { name: 'Practice', level: 1 }),
  ).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Practice' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('⌘\\ or Ctrl+\\ hides the sidebar, and it stays hidden after a reload', async ({
  page,
}) => {
  await page.keyboard.press('ControlOrMeta+Backslash');
  await expect(sidebarOf(page)).toBeHidden();

  await page.reload();
  await expect(sidebarOf(page)).toBeHidden();

  await openButtonOf(page).click();
  await expect(sidebarOf(page)).toBeVisible();
  await page.reload();
  await expect(sidebarOf(page)).toBeVisible();
});

test('a hidden sidebar slides in from the left edge and away again', async ({
  page,
}) => {
  await closeButtonOf(page).click();
  await page.mouse.move(700, 450);
  await expect(sidebarOf(page)).toBeHidden();

  await page.mouse.move(2, 450);
  await expect(sidebarOf(page)).toBeVisible();
  await page.mouse.move(120, 450);
  await expect(sidebarOf(page)).toBeVisible();

  await page.mouse.move(700, 450);
  await expect(sidebarOf(page)).toBeHidden();
});

test('a sidebar that slid in stays while its menu is open', async ({
  page,
  visitor,
}) => {
  await closeButtonOf(page).click();
  await page.mouse.move(700, 450);
  await expect(sidebarOf(page)).toBeHidden();
  await page.mouse.move(2, 450);
  await accountButtonOf(page, visitor.email).click();

  await page.mouse.move(700, 450);
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(sidebarOf(page)).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(accountButtonOf(page, visitor.email)).toBeFocused();
  await expect(sidebarOf(page)).toBeVisible();

  await page.mouse.click(700, 450);
  await expect(sidebarOf(page)).toBeHidden();
});

test('keyboard focus moves to the button that brings the sidebar back', async ({
  page,
  visitor,
}) => {
  await page.keyboard.press('Tab');
  await expect(accountButtonOf(page, visitor.email)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closeButtonOf(page)).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(openButtonOf(page)).toBeFocused();
  await expect(sidebarOf(page)).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(closeButtonOf(page)).toBeFocused();
});

test('a click hides the sidebar without moving focus to the page', async ({
  page,
}) => {
  await closeButtonOf(page).click();

  await expect(sidebarOf(page)).toBeHidden();
  await expect(openButtonOf(page)).not.toBeFocused();
});

test('a click hides the sidebar for good, though the pointer rests in its way', async ({
  page,
}) => {
  await closeButtonOf(page).click();
  await restPointerAt(page, { x: 30, y: 450 }, 500);

  await expect(sidebarOf(page)).toBeHidden();
});

test('signs out from the menu under the name', async ({ page, visitor }) => {
  await accountButtonOf(page, visitor.email).click();
  await expect(page.getByRole('menu')).toContainText(visitor.email);
  await page.getByRole('menuitem', { name: 'Sign out' }).click();

  await expect(page).toHaveURL('/sign-in');
  await page.goto('/practice');
  await expect(page).toHaveURL('/sign-in?next=%2Fpractice');
});

test('opening the app renews a session that is two days old', async ({
  page,
  context,
  visitor,
  db,
}) => {
  await ageSession({
    db,
    context,
    email: visitor.email,
    expiresAt: new Date(Date.now() + (SESSION_DAYS - 2) * DAY_MS),
  });

  await page.reload();

  await expect
    .poll(async () => (await sessionCookie(context)).expires * 1000)
    .toBeGreaterThan(Date.now() + (SESSION_DAYS - 1) * DAY_MS);
});
