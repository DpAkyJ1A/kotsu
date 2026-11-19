import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch as doesProxyMatch,
} from 'next/experimental/testing/server';
import { NextRequest } from 'next/server';
import { describe, expect, test } from 'vitest';

import { REQUEST_PATH_HEADER } from '@/lib/sign-in-path';

import { config, proxy } from './proxy';

const ORIGIN = 'http://localhost:5687';
const SESSION_COOKIE = 'better-auth.session_token=token.sig';

function visit(path: string, headers: Record<string, string> = {}) {
  return proxy(new NextRequest(`${ORIGIN}${path}`, { headers }));
}

function forwardedPathOf(response: Response) {
  return response.headers.get(`x-middleware-request-${REQUEST_PATH_HEADER}`);
}

function runsOn(path: string) {
  return doesProxyMatch({ config, url: `${ORIGIN}${path}` });
}

describe('proxy', () => {
  test('sends a visitor without a session to sign-in and back', () => {
    expect(getRedirectUrl(visit('/calendar?view=week'))).toBe(
      `${ORIGIN}/sign-in?next=%2Fcalendar%3Fview%3Dweek`,
    );
  });

  test('lets a visitor with a session cookie through', () => {
    const response = visit('/calendar', { cookie: SESSION_COOKIE });

    expect(getRedirectUrl(response)).toBeNull();
  });

  test('tells the page which address it serves, whatever the visitor claims', () => {
    const response = visit('/calendar?view=week', {
      cookie: SESSION_COOKIE,
      [REQUEST_PATH_HEADER]: '/practice',
    });

    expect(forwardedPathOf(response)).toBe('/calendar?view=week');
  });

  test('accepts the cookie under its https name', () => {
    const response = visit('/calendar', {
      cookie: '__Secure-better-auth.session_token=token.sig',
    });

    expect(getRedirectUrl(response)).toBeNull();
  });

  test.each(['/sign-in', '/sign-in/code'])('lets anyone open %s', (path) => {
    expect(getRedirectUrl(visit(path))).toBeNull();
  });

  test('runs on pages only', () => {
    expect(runsOn('/calendar')).toBe(true);
    expect(runsOn('/docs/0193b1c2-7d4e-7000-8000-000000000000')).toBe(true);
    expect(runsOn('/api/auth/get-session')).toBe(false);
    expect(runsOn('/_next/static/chunks/main.js')).toBe(false);
    expect(runsOn('/favicon.ico')).toBe(false);
  });

  test.each(['/manifest.webmanifest', '/icon/192', '/apple-icon/180?a1b2c3'])(
    'leaves %s open to anyone, so the browser can install the app',
    (path) => {
      expect(runsOn(path)).toBe(false);
    },
  );

  test('still guards a page whose name starts like an icon', () => {
    expect(runsOn('/icons')).toBe(true);
  });
});
