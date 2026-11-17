import { describe, expect, test } from 'vitest';

import { THEME_COOKIE, themeCookie, themeFrom } from './theme-cookie';

describe('theme cookie', () => {
  test.each(['light', 'dark'] as const)(
    'reads back the %s theme it wrote',
    (theme) => {
      const [pair = ''] = themeCookie(theme).split(';');
      const [name, value] = pair.split('=');

      expect(name).toBe(THEME_COOKIE);
      expect(themeFrom(value)).toBe(theme);
    },
  );

  test.each([
    ['no cookie', undefined],
    ['an unknown theme', 'sepia'],
  ])('leaves the theme to the system for %s', (_, cookie) => {
    expect(themeFrom(cookie)).toBeUndefined();
  });

  test('keeps the pick for a year on every page', () => {
    expect(themeCookie('dark')).toBe(
      'theme=dark; path=/; max-age=31536000; samesite=lax',
    );
  });
});
