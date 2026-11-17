export type Theme = 'light' | 'dark';

export const THEME_COOKIE = 'theme';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function themeFrom(value: string | undefined): Theme | undefined {
  return value === 'light' || value === 'dark' ? value : undefined;
}

export function themeCookie(theme: Theme) {
  return `${THEME_COOKIE}=${theme}; path=/; max-age=${String(ONE_YEAR_IN_SECONDS)}; samesite=lax`;
}
