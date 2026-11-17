import 'server-only';

import type { Env } from '@/server/env';

type Deployment = Pick<
  Env,
  'VERCEL_ENV' | 'VERCEL_PROJECT_PRODUCTION_URL' | 'VERCEL_BRANCH_URL'
>;

const LOCALHOST = 'localhost';

export function relyingPartyId({
  VERCEL_ENV,
  VERCEL_PROJECT_PRODUCTION_URL,
  VERCEL_BRANCH_URL,
}: Deployment) {
  if (VERCEL_ENV === 'production') {
    return VERCEL_PROJECT_PRODUCTION_URL ?? LOCALHOST;
  }
  if (VERCEL_ENV === 'preview') return VERCEL_BRANCH_URL ?? LOCALHOST;
  return LOCALHOST;
}
