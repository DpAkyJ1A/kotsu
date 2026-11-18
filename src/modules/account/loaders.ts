import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';

import { getCtx } from '@/server/ctx/get-ctx';

import { PASSKEY_OFFER_COOKIE } from './core/passkey-offer-cookie';
import { toSettingsDto } from './domain/dto';
import { findAccount } from './domain/queries';

export const loadAccount = cache(async () => findAccount(await getCtx()));

export const loadSettings = cache(async () =>
  toSettingsDto((await getCtx()).settings),
);

export async function isPasskeyOfferAnswered() {
  return (await cookies()).has(PASSKEY_OFFER_COOKIE.name);
}
