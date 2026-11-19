import { randomInt, randomUUID } from 'node:crypto';

import { expect, type Page, test as base } from '@playwright/test';
import { symmetricDecrypt } from 'better-auth/crypto';
import { desc, eq } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { session, user, verification } from '@/server/db/schema/auth';

export const WITHOUT_GOOGLE_URL = 'http://localhost:5688';

const DAY_MS = 24 * 60 * 60 * 1000;

export type Visitor = { email: string; readCode: () => Promise<string> };

export const test = base.extend<{ visitor: Visitor }, { db: NodePgDatabase }>({
  db: [
    async ({}, use) => {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      await use(drizzle({ client: pool }));
      await pool.end();
    },
    { scope: 'worker' },
  ],
  visitor: async ({ db, page }, provide) => {
    const email = `ada+${randomUUID()}@example.com`;
    const codeId = `sign-in-otp-${email}`;
    await page.setExtraHTTPHeaders({ 'x-forwarded-for': randomIp() });

    await provide({ email, readCode: () => readCode(db, codeId) });

    await db.delete(user).where(eq(user.email, email));
    await db.delete(verification).where(eq(verification.identifier, codeId));
  },
});

function randomIp() {
  return [10, randomInt(256), randomInt(256), randomInt(1, 255)].join('.');
}

async function readCode(db: NodePgDatabase, codeId: string) {
  const [row] = await db
    .select({ value: verification.value })
    .from(verification)
    .where(eq(verification.identifier, codeId))
    .orderBy(desc(verification.createdAt))
    .limit(1);
  const [storedCode = ''] = row?.value.split(':') ?? [];
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('BETTER_AUTH_SECRET is not set for the e2e run');
  return symmetricDecrypt({ key: secret, data: storedCode });
}

export async function requestCode(page: Page, email: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(
    page.getByRole('heading', { name: 'Check your email' }),
  ).toBeVisible();
}

export async function signInWithCode(page: Page, visitor: Visitor) {
  await requestCode(page, visitor.email);
  await page.getByLabel('Code').fill(await visitor.readCode());
}

export function settingsSaved(page: Page) {
  return page.waitForResponse(
    (response) => response.request().headers()['next-action'] !== undefined,
  );
}

export async function userIdOf(db: NodePgDatabase, email: string) {
  const [found] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email));
  if (!found) throw new Error(`No user ${email}`);
  return found.id;
}

export async function signedInDaysAgo(
  db: NodePgDatabase,
  email: string,
  days: number,
) {
  await db
    .update(session)
    .set({ createdAt: new Date(Date.now() - days * DAY_MS) })
    .where(eq(session.userId, await userIdOf(db, email)));
}
