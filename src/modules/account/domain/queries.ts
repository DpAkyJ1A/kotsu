import 'server-only';

import { eq } from 'drizzle-orm';

import type { Ctx } from '@/server/ctx/load-ctx';
import { user } from '@/server/db/schema/auth';

import type { Account } from '../core/account';

export async function findAccount(ctx: Ctx): Promise<Account> {
  const [account] = await ctx.db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, ctx.userId));
  if (!account) throw new Error(`No user ${ctx.userId}`);
  return account;
}
