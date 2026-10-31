import 'server-only';

import { sql } from 'drizzle-orm';

import { db } from '@/server/db/client';

// Throws when the database can't be reached
export async function checkHealth() {
  await db.execute(sql`select 1`);
  return { status: 'ok' } as const;
}
