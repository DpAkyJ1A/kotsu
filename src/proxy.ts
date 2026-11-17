import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

import { REQUEST_PATH_HEADER, signInPath } from '@/lib/sign-in-path';

const PUBLIC_PAGES = ['/sign-in', '/sign-in/code'];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const path = `${pathname}${search}`;

  if (PUBLIC_PAGES.includes(pathname) || getSessionCookie(request)) {
    return NextResponse.next({
      request: { headers: withRequestPath(request.headers, path) },
    });
  }
  return NextResponse.redirect(new URL(signInPath(path), request.url));
}

function withRequestPath(headers: Headers, path: string) {
  const forwarded = new Headers(headers);
  forwarded.set(REQUEST_PATH_HEADER, path);
  return forwarded;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
