import { describe, expect, test } from 'vitest';

import {
  codePagePath,
  passkeyOfferPath,
  signInPagePath,
  toNextPath,
} from './sign-in-paths';

describe('toNextPath', () => {
  test.each([
    ['/calendar', '/calendar'],
    [
      '/calendar?view=week&date=2026-11-14',
      '/calendar?view=week&date=2026-11-14',
    ],
    ['/docs/0193b1c2#card', '/docs/0193b1c2#card'],
  ])('keeps the path of this site %s', (next, path) => {
    expect(toNextPath(next)).toBe(path);
  });

  test.each([
    ['nothing', undefined],
    ['a repeated parameter', ['/calendar', '/practice']],
    ['an empty value', ''],
    ['another site', 'https://example.com/calendar'],
    ['a protocol-relative link', '//example.com/calendar'],
    ['a backslash the browser reads as a slash', '/\\example.com'],
    ['a tab the URL parser drops', '/\t/example.com'],
    ['a dot segment before a double slash', '/.//example.com'],
    ['a parent segment before a double slash', '/a/..//example.com'],
    ['a dot segment before a backslash', '/.\\/example.com'],
    ['a relative path', 'calendar'],
    ['a script', 'javascript:alert(1)'],
  ])('falls back to the home page for %s', (_, next) => {
    expect(toNextPath(next)).toBe('/');
  });
});

describe('sign-in paths', () => {
  test('carry the page to return to', () => {
    const calendar = toNextPath('/calendar');

    expect(signInPagePath(calendar)).toBe('/sign-in?next=%2Fcalendar');
    expect(codePagePath('ada@example.com', calendar)).toBe(
      '/sign-in/code?email=ada%40example.com&next=%2Fcalendar',
    );
    expect(passkeyOfferPath(calendar)).toBe(
      '/sign-in/passkey?next=%2Fcalendar',
    );
  });

  test('leave it out when it is the home page', () => {
    expect(signInPagePath('/')).toBe('/sign-in');
    expect(codePagePath('ada@example.com', '/')).toBe(
      '/sign-in/code?email=ada%40example.com',
    );
    expect(passkeyOfferPath('/')).toBe('/sign-in/passkey');
  });
});
