import 'server-only';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { LOCALE_COOKIE, pickLocale } from '@/lib/pick-locale';
import { REQUEST_PATH_HEADER, signInPath } from '@/lib/sign-in-path';
import { auth } from '@/server/auth/auth';
import { db } from '@/server/db/client';

import { loadCtx } from './load-ctx';

export const findVisitorLocale = cache(async () =>
  pickLocale({
    cookie: (await cookies()).get(LOCALE_COOKIE)?.value,
    acceptLanguage: (await headers()).get('accept-language'),
  }),
);

export const findCtx = cache(async () =>
  loadCtx({
    auth,
    db,
    headers: await headers(),
    locale: await findVisitorLocale(),
    now: new Date(),
  }),
);

export const getCtx = cache(async () => {
  const ctx = await findCtx();
  if (!ctx) redirect(signInPath((await headers()).get(REQUEST_PATH_HEADER)));
  return ctx;
});
