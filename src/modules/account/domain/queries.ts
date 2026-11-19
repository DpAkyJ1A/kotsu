import 'server-only';

import { and, eq } from 'drizzle-orm';

import type { Ctx } from '@/server/ctx/load-ctx';
import { account, user } from '@/server/db/schema/auth';

import type { Account } from '../core/account';
import type { GoogleLink } from '../core/google-link';

export async function findAccount(ctx: Ctx): Promise<Account> {
  const [found] = await ctx.db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, ctx.userId));
  if (!found) throw new Error(`No user ${ctx.userId}`);
  return found;
}

export async function findGoogleLink(ctx: Ctx): Promise<GoogleLink> {
  const google = await ctx.db
    .select({ id: account.id })
    .from(account)
    .where(
      and(eq(account.userId, ctx.userId), eq(account.providerId, 'google')),
    )
    .orderBy(account.createdAt);
  return google.length > 0
    ? { status: 'connected', accountIds: google.map(({ id }) => id) }
    : { status: 'notConnected' };
}
