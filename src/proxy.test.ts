import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch as doesProxyMatch,
} from 'next/experimental/testing/server';
import { NextRequest } from 'next/server';
import { describe, expect, test } from 'vitest';

import { config, proxy } from './proxy';

const ORIGIN = 'http://localhost:5687';

function visit(path: string, cookie?: string) {
  return proxy(
    new NextRequest(`${ORIGIN}${path}`, {
      headers: cookie ? { cookie } : {},
    }),
  );
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
    const response = visit('/calendar', 'better-auth.session_token=token.sig');

    expect(getRedirectUrl(response)).toBeNull();
  });

  test('accepts the cookie under its https name', () => {
    const response = visit(
      '/calendar',
      '__Secure-better-auth.session_token=token.sig',
    );

    expect(getRedirectUrl(response)).toBeNull();
  });

  test.each(['/', '/sign-in', '/sign-in/code'])(
    'lets anyone open %s',
    (path) => {
      expect(getRedirectUrl(visit(path))).toBeNull();
    },
  );

  test('runs on pages only', () => {
    expect(runsOn('/calendar')).toBe(true);
    expect(runsOn('/docs/0193b1c2-7d4e-7000-8000-000000000000')).toBe(true);
    expect(runsOn('/api/auth/get-session')).toBe(false);
    expect(runsOn('/_next/static/chunks/main.js')).toBe(false);
    expect(runsOn('/favicon.ico')).toBe(false);
  });
});
