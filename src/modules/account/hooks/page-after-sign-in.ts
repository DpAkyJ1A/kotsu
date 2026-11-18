import type { Route } from 'next';

import { platformAuthenticatorIsAvailable } from '@/lib/auth-client';

import { passkeyOfferPath } from '../core/sign-in-paths';

export async function pageAfterSignIn(next: Route) {
  const canOfferPasskey = await platformAuthenticatorIsAvailable().catch(
    () => false,
  );
  return canOfferPasskey ? passkeyOfferPath(next) : next;
}
