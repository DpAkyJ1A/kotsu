import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { cache } from 'react';

import { auth } from '@/server/auth/auth';
import { db } from '@/server/db/client';

import { loadCtx } from './load-ctx';

export const getCtx = cache(async () => {
  const ctx = await loadCtx({
    auth,
    db,
    headers: await headers(),
    locale: await getLocale(),
    now: new Date(),
  });
  if (!ctx) redirect('/sign-in');
  return ctx;
});
