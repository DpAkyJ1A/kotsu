import { describe, expect, test } from 'vitest';

import { pickLocale } from '@/lib/pick-locale';
import { themeFrom } from '@/lib/theme-cookie';

import type { Settings } from './settings';
import { settingsCookies } from './settings-cookies';

const SETTINGS: Settings = {
  theme: 'system',
  locale: 'ru',
  dayEndsAt: '04:00',
  weekStart: 'monday',
  timeFormat: 'h24',
};

const valueOf = (name: string, settings = SETTINGS) =>
  settingsCookies(settings).find((cookie) => cookie.name === name)?.value;

describe('settingsCookies', () => {
  test('the pages without a user read back the theme and the language', () => {
    expect(themeFrom(valueOf('theme'))).toBe('system');
    expect(
      pickLocale({ cookie: valueOf('locale'), acceptLanguage: 'en' }),
    ).toBe('ru');
  });

  test('keeps a picked theme', () => {
    expect(valueOf('theme', { ...SETTINGS, theme: 'dark' })).toBe('dark');
  });

  test('keeps both for a year, out of reach of scripts', () => {
    for (const cookie of settingsCookies(SETTINGS)) {
      expect(cookie).toMatchObject({
        maxAge: 31_536_000,
        httpOnly: true,
        sameSite: 'lax',
      });
    }
  });
});
