import 'server-only';

import { cookies } from 'next/headers';

import { PASSKEY_OFFER_COOKIE } from './core/passkey-offer-cookie';

export async function isPasskeyOfferAnswered() {
  return (await cookies()).has(PASSKEY_OFFER_COOKIE.name);
}
