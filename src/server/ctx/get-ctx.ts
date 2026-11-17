import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { cache } from 'react';

import { REQUEST_PATH_HEADER, signInPath } from '@/lib/sign-in-path';
import { auth } from '@/server/auth/auth';
import { db } from '@/server/db/client';

import { loadCtx } from './load-ctx';

export const findCtx = cache(async () =>
  loadCtx({
    auth,
    db,
    headers: await headers(),
    locale: await getLocale(),
    now: new Date(),
  }),
);

export const getCtx = cache(async () => {
  const ctx = await findCtx();
  if (!ctx) redirect(signInPath((await headers()).get(REQUEST_PATH_HEADER)));
  return ctx;
});
