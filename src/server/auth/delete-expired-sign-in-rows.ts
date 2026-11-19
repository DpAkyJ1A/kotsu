import 'server-only';

import { lt } from 'drizzle-orm';

import type { Db } from '@/server/db/client';
import {
  session,
  signInCodeCount,
  verification,
} from '@/server/db/schema/auth';

import { countWindowStart } from './count-sign-in-code';

export async function deleteExpiredSignInRows(db: Db, now: Date) {
  await Promise.all([
    db.delete(session).where(lt(session.expiresAt, now)),
    db.delete(verification).where(lt(verification.expiresAt, now)),
    db
      .delete(signInCodeCount)
      .where(lt(signInCodeCount.windowStartedAt, countWindowStart(now))),
  ]);
}
