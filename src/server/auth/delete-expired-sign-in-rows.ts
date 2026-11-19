import 'server-only';

import { lt } from 'drizzle-orm';

import type { Db } from '@/server/db/client';
import { session, verification } from '@/server/db/schema/auth';

export async function deleteExpiredSignInRows(db: Db, now: Date) {
  await Promise.all([
    db.delete(session).where(lt(session.expiresAt, now)),
    db.delete(verification).where(lt(verification.expiresAt, now)),
  ]);
}
