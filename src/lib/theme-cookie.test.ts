import { describe, expect, test } from 'vitest';

import { themeAttribute, themeFrom } from './theme-cookie';

describe('themeFrom', () => {
  test.each(['light', 'dark', 'system'] as const)(
    'reads the %s theme back',
    (theme) => {
      expect(themeFrom(theme)).toBe(theme);
    },
  );

  test.each([
    ['no cookie', undefined],
    ['an unknown theme', 'sepia'],
  ])('leaves the theme to the system for %s', (_, cookie) => {
    expect(themeFrom(cookie)).toBe('system');
  });
});

describe('themeAttribute', () => {
  test.each(['light', 'dark'] as const)(
    'pins the page to the %s theme',
    (theme) => {
      expect(themeAttribute(theme)).toBe(theme);
    },
  );

  test('leaves no attribute for the system theme, so the CSS follows it', () => {
    expect(themeAttribute('system')).toBeUndefined();
  });
});
