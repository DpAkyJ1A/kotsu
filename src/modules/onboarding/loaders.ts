import 'server-only';

import { cache } from 'react';

import { getCtx } from '@/server/ctx/get-ctx';

export const isOnboarded = cache(
  async () => (await getCtx()).settings.onboardedAt !== null,
);
