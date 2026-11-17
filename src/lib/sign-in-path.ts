import type { Route } from 'next';

export const HOME_PATH = '/calendar';

export const REQUEST_PATH_HEADER = 'x-request-path';

export function signInPath(next: string | null): Route {
  if (!next || next === HOME_PATH) return '/sign-in';
  return `/sign-in?${new URLSearchParams({ next })}`;
}
