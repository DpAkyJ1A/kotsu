import type { Theme } from './user-settings';

export const BACKGROUND = { light: '#ffffff', dark: '#121214' } as const;

type ThemeColor = { media: string; color: string };

export function themeColors(theme: Theme): ThemeColor[] {
  return (['light', 'dark'] as const).map((scheme) => ({
    media: `(prefers-color-scheme: ${scheme})`,
    color: BACKGROUND[theme === 'system' ? scheme : theme],
  }));
}
