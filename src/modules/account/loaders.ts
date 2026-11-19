import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';

import { hasGoogleSignIn } from '@/server/auth/auth';
import { getCtx } from '@/server/ctx/get-ctx';

import type { GoogleLink } from './core/google-link';
import { PASSKEY_OFFER_COOKIE } from './core/passkey-offer-cookie';
import { toSettingsDto } from './domain/dto';
import { findAccount, findGoogleLink } from './domain/queries';

export const loadAccount = cache(async () => findAccount(await getCtx()));

export const loadSettings = cache(async () =>
  toSettingsDto((await getCtx()).settings),
);

export const loadGoogleLink = cache(async (): Promise<GoogleLink> =>
  hasGoogleSignIn ? findGoogleLink(await getCtx()) : { status: 'off' },
);

export async function isPasskeyOfferAnswered() {
  return (await cookies()).has(PASSKEY_OFFER_COOKIE.name);
}
