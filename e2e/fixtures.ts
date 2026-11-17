import { randomInt, randomUUID } from 'node:crypto';

import { test as base } from '@playwright/test';
import { symmetricDecrypt } from 'better-auth/crypto';
import { desc, eq } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { user, verification } from '@/server/db/schema/auth';

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
