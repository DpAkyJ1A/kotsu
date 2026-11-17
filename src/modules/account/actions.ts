'use server';

import { cookies } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

import { PASSKEY_OFFER_COOKIE } from './core/passkey-offer-cookie';
import { toNextPath } from './core/sign-in-paths';

export async function answerPasskeyOffer(next: string) {
  (await cookies()).set(PASSKEY_OFFER_COOKIE);
  redirect(toNextPath(next), RedirectType.replace);
}
