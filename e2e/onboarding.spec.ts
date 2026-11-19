import { expect, type Page } from '@playwright/test';
import { eq } from 'drizzle-orm';

import { userSettings } from '@/server/db/schema/settings';

import { actionAnswered, signInWithCode, test, userIdOf } from './fixtures';

test.use({ locale: 'en-US', timezoneId: 'Europe/Madrid' });

test.skip(
  ({ browserName, baseURL }) =>
    browserName === 'webkit' && baseURL?.startsWith('http://') === true,
  'WebKit drops the Secure session cookie on plain http, as the local and CI servers are',
);

const TEMPLATES = [
  'Learn a language',
  'Study a course',
  'Job search & growth',
  'Start blank',
];

function templatesOf(page: Page) {
  return page.getByRole('radiogroup', { name: 'Pick a starting point' });
}

async function pickTemplate(page: Page, template: string) {
  await templatesOf(page).getByRole('radio', { name: template }).click();
  const answered = actionAnswered(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await answered;
}

test.describe('a new account', () => {
  test.use({ onboarded: false });

  test('picks a template after signing in and gets its shelves', async ({
    page,
    visitor,
    db,
  }) => {
    await signInWithCode(page, visitor);

    await expect(page).toHaveURL('/onboarding');
    const templates = templatesOf(page).getByRole('radio');
    await expect(templates).toHaveCount(TEMPLATES.length);
    for (const [index, name] of TEMPLATES.entries()) {
      await expect(templates.nth(index)).toHaveAccessibleName(name);
    }
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();

    await pickTemplate(page, 'Job search & growth');

    await expect(page).toHaveURL('/calendar');
    await page.goto('/shelves');
    await expect(
      page.getByRole('main').getByRole('listitem').getByRole('link'),
    ).toHaveText(['Job search', 'Interview prep', 'English', 'Projects']);
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, await userIdOf(db, visitor.email)));
    expect(settings?.timezone).toBe('Europe/Madrid');
  });

  test('goes on to the page it asked for', async ({ page, visitor }) => {
    await page.goto('/practice');
    await page.getByLabel('Email').fill(visitor.email);
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(
      page.getByRole('heading', { name: 'Check your email' }),
    ).toBeVisible();
    await page.getByLabel('Code').fill(await visitor.readCode());
    await expect(page).toHaveURL('/onboarding?next=%2Fpractice');

    await pickTemplate(page, 'Start blank');

    await expect(page).toHaveURL('/practice');
  });
});

test('an onboarded account skips the picker', async ({ page, visitor }) => {
  await signInWithCode(page, visitor);
  await expect(page).toHaveURL('/calendar');

  await page.goto('/onboarding?next=%2Fclock');

  await expect(page).toHaveURL('/clock');
});
