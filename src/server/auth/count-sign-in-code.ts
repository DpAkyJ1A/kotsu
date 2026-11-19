import 'server-only';

import { lte, sql } from 'drizzle-orm';

import type { Db } from '@/server/db/client';
import { signInCodeCount } from '@/server/db/schema/auth';

export const CODES_PER_EMAIL = 3;
const CODE_COUNT_WINDOW_MS = 15 * 60 * 1000;

export function countWindowStart(now: Date) {
  return new Date(now.getTime() - CODE_COUNT_WINDOW_MS);
}

export async function countSignInCode(db: Db, email: string, now: Date) {
  const windowIsOver = lte(
    signInCodeCount.windowStartedAt,
    countWindowStart(now),
  );
  const [count] = await db
    .insert(signInCodeCount)
    .values({ email, windowStartedAt: now, requests: 1 })
    .onConflictDoUpdate({
      target: signInCodeCount.email,
      set: {
        windowStartedAt: sql`case when ${windowIsOver} then ${now} else ${signInCodeCount.windowStartedAt} end`,
        requests: sql`case when ${windowIsOver} then 1 else ${signInCodeCount.requests} + 1 end`,
      },
    })
    .returning({ requests: signInCodeCount.requests });
  if (!count) throw new Error('The upsert returned no count');
  return count.requests;
}
