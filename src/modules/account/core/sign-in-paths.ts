import type { Route } from 'next';

type SearchParam = string | string[] | undefined;

const HOME = '/';
const ANY_ORIGIN = 'http://kotsu.invalid';

export function toNextPath(next: SearchParam): Route {
  if (typeof next !== 'string' || !next.startsWith('/')) return HOME;

  const url = new URL(next, ANY_ORIGIN);
  const isThisSite =
    url.origin === ANY_ORIGIN && !url.pathname.startsWith('//');
  if (!isThisSite) return HOME;
  return `${url.pathname}${url.search}${url.hash}` as Route;
}

export function signInPagePath(next: Route): Route {
  return next === HOME
    ? '/sign-in'
    : `/sign-in?${new URLSearchParams({ next })}`;
}

export function codePagePath(email: string, next: Route): Route {
  const params = new URLSearchParams({ email });
  if (next !== HOME) params.set('next', next);
  return `/sign-in/code?${params}`;
}

export function passkeyOfferPath(next: Route): Route {
  return next === HOME
    ? '/sign-in/passkey'
    : `/sign-in/passkey?${new URLSearchParams({ next })}`;
}
