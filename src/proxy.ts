import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_PAGES = ['/', '/sign-in'];

export function proxy(request: NextRequest) {
  const isPublic = PUBLIC_PAGES.includes(request.nextUrl.pathname);
  if (isPublic || getSessionCookie(request)) return NextResponse.next();

  return NextResponse.redirect(new URL('/sign-in', request.url));
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
