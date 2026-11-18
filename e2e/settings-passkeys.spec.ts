import { expect, type Page } from '@playwright/test';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { passkey, session, user } from '@/server/db/schema/auth';

import { signInWithCode, test } from './fixtures';

const PHONE = { width: 390, height: 844 };
const DAY_MS = 24 * 60 * 60 * 1000;

test.use({ locale: 'en-US', colorScheme: 'light' });

test.skip(
  ({ browserName, baseURL }) =>
    browserName === 'webkit' && baseURL?.startsWith('http://') === true,
  'WebKit drops the Secure session cookie on plain http, as the local and CI servers are',
);

test.beforeEach(async ({ page, context, visitor }) => {
  await context.credentials.install();
  await context.addInitScript(() => {
    const signals: unknown[] = [];
    Object.defineProperty(window, 'passkeySignals', { value: signals });
    Object.defineProperty(PublicKeyCredential, 'signalUnknownCredential', {
      value: (options: unknown) => {
        signals.push(options);
        return Promise.resolve();
      },
    });
  });
  await signInWithCode(page, visitor);
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page).toHaveURL('/calendar');
});

function passkeySignals(page: Page) {
  return page.evaluate((): unknown => Reflect.get(window, 'passkeySignals'));
}

async function passkeysOf(db: NodePgDatabase, email: string) {
  return db
    .select({ name: passkey.name })
    .from(passkey)
    .innerJoin(user, eq(user.id, passkey.userId))
    .where(eq(user.email, email));
}

async function signedInDaysAgo(
  db: NodePgDatabase,
  email: string,
  days: number,
) {
  const [account] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email));
  await db
    .update(session)
    .set({ createdAt: new Date(Date.now() - days * DAY_MS) })
    .where(eq(session.userId, account?.id ?? ''));
}

test.describe('on a wide screen', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'Phones open the settings as pages, below',
  );

  test('a passkey added in the settings is named for its device, renamed, and once removed the device forgets it too', async ({
    page,
    context,
    visitor,
    db,
  }) => {
    await page.keyboard.press('ControlOrMeta+Comma');
    const dialog = page.getByRole('dialog', { name: 'Settings' });
    await dialog.getByRole('button', { name: 'Sign-in & passkeys' }).click();
    await expect(page).toHaveURL('/calendar?settings=security');
    const passkeys = dialog.getByRole('region', { name: 'Passkeys' });
    await expect(passkeys.getByText('No passkeys yet.')).toBeVisible();

    await passkeys.getByRole('button', { name: 'Add passkey' }).click();

    await expect(page.getByText('Passkey added.')).toBeVisible();
    await expect(passkeys.getByRole('listitem')).toHaveText(
      /^Chrome · WindowsAdded \w{3} \d{1,2}, \d{4}$/,
    );
    const [credential] = await context.credentials.get({ rpId: 'localhost' });

    await passkeys
      .getByRole('button', { name: 'Rename Chrome · Windows' })
      .click();
    const rename = page.getByRole('dialog', { name: 'Rename passkey' });
    await rename.getByLabel('Name').fill('Work laptop');
    await rename.getByRole('button', { name: 'Save' }).click();
    await expect(rename).toBeHidden();
    await expect(passkeys.getByRole('listitem')).toContainText('Work laptop');
    expect(await passkeysOf(db, visitor.email)).toEqual([
      { name: 'Work laptop' },
    ]);

    await passkeys.getByRole('button', { name: 'Remove Work laptop' }).click();
    await page
      .getByRole('dialog', { name: 'Remove “Work laptop”?' })
      .getByRole('button', { name: 'Remove' })
      .click();

    await expect(passkeys.getByText('No passkeys yet.')).toBeVisible();
    expect(await passkeysOf(db, visitor.email)).toEqual([]);
    expect(await passkeySignals(page)).toEqual([
      { rpId: 'localhost', credentialId: credential?.id },
    ]);
  });

  test('a day after signing in, adding a passkey asks for an emailed code first', async ({
    page,
    visitor,
    db,
  }) => {
    await signedInDaysAgo(db, visitor.email, 2);
    await page.goto('/calendar?settings=security');
    const dialog = page.getByRole('dialog', { name: 'Settings' });

    await dialog.getByRole('button', { name: 'Add passkey' }).click();
    const confirmation = dialog.getByRole('group', {
      name: "Confirm it's you",
    });
    await confirmation.getByRole('button', { name: 'Send code' }).click();
    const code = confirmation.getByLabel('Code');
    await expect(code).toBeVisible();
    await code.fill(await visitor.readCode());
    await confirmation.getByRole('button', { name: 'Confirm' }).click();
    await expect(confirmation).toBeHidden();
    await expect(
      dialog.getByRole('button', { name: 'Add passkey' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByText('Passkey added.')).toBeVisible();
    expect(await passkeysOf(db, visitor.email)).toEqual([
      { name: 'Chrome · Windows' },
    ]);
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: PHONE });

  test('the passkeys are a settings page of their own', async ({
    page,
    visitor,
    db,
  }) => {
    await page
      .getByRole('main')
      .getByRole('link', { name: 'Settings' })
      .click();
    await page.getByRole('link', { name: 'Sign-in & passkeys' }).click();
    await expect(page).toHaveURL('/settings/security');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const passkeys = page.getByRole('region', { name: 'Passkeys' });
    await passkeys.getByRole('button', { name: 'Add passkey' }).click();
    await expect(passkeys.getByRole('listitem')).toHaveCount(1);

    await passkeys.getByRole('button', { name: /^Remove / }).click();
    await page
      .getByRole('dialog', { name: /^Remove “/ })
      .getByRole('button', { name: 'Remove' })
      .click();

    await expect(passkeys.getByText('No passkeys yet.')).toBeVisible();
    expect(await passkeysOf(db, visitor.email)).toEqual([]);
  });
});
