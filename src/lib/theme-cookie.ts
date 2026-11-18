import { type Theme, THEMES } from './user-settings';

export const THEME_COOKIE = 'theme';

export function themeFrom(cookie: string | undefined): Theme {
  return THEMES.find((theme) => theme === cookie) ?? 'system';
}

export function themeAttribute(theme: Theme) {
  return theme === 'system' ? undefined : theme;
}
