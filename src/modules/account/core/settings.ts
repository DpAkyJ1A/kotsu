import type { Locale } from 'next-intl';
import { z } from 'zod';

import {
  LOCALES,
  type Theme,
  THEMES,
  TIME_FORMATS,
  type TimeFormat,
  WEEK_STARTS,
  type WeekStart,
} from '@/lib/user-settings';

export type Settings = {
  theme: Theme;
  locale: Locale;
  dayEndsAt: DayEndTime;
  weekStart: WeekStart;
  timeFormat: TimeFormat;
};

export const DAY_END_TIMES = [
  '00:00',
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
] as const;

export const DayEndsAt = z.enum(DAY_END_TIMES);

export type DayEndTime = z.infer<typeof DayEndsAt>;

export const UpdateSettingsInput = z
  .strictObject({
    theme: z.enum(THEMES),
    locale: z.enum(LOCALES),
    dayEndsAt: DayEndsAt,
    weekStart: z.enum(WEEK_STARTS),
    timeFormat: z.enum(TIME_FORMATS),
  })
  .partial()
  .refine((patch) => Object.values(patch).some((value) => value !== undefined));

export type SettingsPatch = z.input<typeof UpdateSettingsInput>;
