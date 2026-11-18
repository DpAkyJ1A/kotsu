import type { Route } from 'next';

import { HOME_PATH } from '@/lib/sign-in-path';

type SearchParam = string | string[] | undefined;

const ANY_ORIGIN = 'http://kotsu.invalid';

export const SIGN_IN_CANCELLED = 'access_denied';

export function toNextPath(next: SearchParam): Route {
  if (typeof next !== 'string' || !next.startsWith('/')) return HOME_PATH;

  const url = new URL(next, ANY_ORIGIN);
  const isThisSite =
    url.origin === ANY_ORIGIN && !url.pathname.startsWith('//');
  if (!isThisSite) return HOME_PATH;
  return `${url.pathname}${url.search}${url.hash}` as Route;
}

export function codePagePath(email: string, next: Route): Route {
  const params = new URLSearchParams({ email });
  if (next !== HOME_PATH) params.set('next', next);
  return `/sign-in/code?${params}`;
}

export function passkeyOfferPath(next: Route): Route {
  return next === HOME_PATH
    ? '/sign-in/passkey'
    : `/sign-in/passkey?${new URLSearchParams({ next })}`;
}
