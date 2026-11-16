import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_PAGES = ['/', '/sign-in', '/sign-in/code'];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PAGES.includes(pathname) || getSessionCookie(request)) {
    return NextResponse.next();
  }

  const signIn = new URL('/sign-in', request.url);
  signIn.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
