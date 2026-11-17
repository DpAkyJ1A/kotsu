import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';

import { getCtx } from '@/server/ctx/get-ctx';

import { PASSKEY_OFFER_COOKIE } from './core/passkey-offer-cookie';
import { findAccount } from './domain/queries';

export const loadAccount = cache(async () => findAccount(await getCtx()));

export async function isPasskeyOfferAnswered() {
  return (await cookies()).has(PASSKEY_OFFER_COOKIE.name);
}
