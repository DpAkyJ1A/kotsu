import { describe, expect, test } from 'vitest';

import { isCurrentTab } from './current-tab';

const DOC = '/docs/019a9c3e-0101-7000-8000-000000000101';

describe('current tab', () => {
  test.each(['/shelves', '/shelves/spanish', DOC])(
    'is Shelves on %s, since a doc lives on a shelf',
    (pathname) => {
      expect(isCurrentTab(pathname, '/shelves')).toBe(true);
    },
  );

  test.each(['/calendar', '/practice', '/clock', '/search'])(
    'is not %s on a doc page',
    (href) => {
      expect(isCurrentTab(DOC, href)).toBe(false);
    },
  );

  test.each(['/calendar', '/docsx', '/shelvesx'])(
    'is not Shelves on %s',
    (pathname) => {
      expect(isCurrentTab(pathname, '/shelves')).toBe(false);
    },
  );

  test('is the tab of its own section', () => {
    expect(isCurrentTab('/calendar', '/calendar')).toBe(true);
  });
});
