import { LOCALE_COOKIE } from '@/lib/pick-locale';
import { THEME_COOKIE } from '@/lib/theme-cookie';

import type { Settings } from './settings';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

const KEPT_ON_THIS_DEVICE = {
  maxAge: ONE_YEAR_IN_SECONDS,
  httpOnly: true,
  sameSite: 'lax',
} as const;

export function settingsCookies({ theme, locale }: Settings) {
  return [
    { name: THEME_COOKIE, value: theme, ...KEPT_ON_THIS_DEVICE },
    { name: LOCALE_COOKIE, value: locale, ...KEPT_ON_THIS_DEVICE },
  ];
}
