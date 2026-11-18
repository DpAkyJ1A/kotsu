export const THEMES = ['light', 'dark', 'system'] as const;
export const LOCALES = ['en', 'ru'] as const;
export const WEEK_STARTS = ['monday', 'sunday'] as const;
export const TIME_FORMATS = ['h24', 'h12'] as const;

export type Theme = (typeof THEMES)[number];
export type WeekStart = (typeof WEEK_STARTS)[number];
export type TimeFormat = (typeof TIME_FORMATS)[number];
