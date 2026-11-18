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
  dayEndsAt: string;
  weekStart: WeekStart;
  timeFormat: TimeFormat;
};

const LATEST_DAY_END = '06:00';

export const UpdateSettingsInput = z
  .strictObject({
    theme: z.enum(THEMES),
    locale: z.enum(LOCALES),
    dayEndsAt: z.iso
      .time({ precision: -1 })
      .refine((time) => time <= LATEST_DAY_END),
    weekStart: z.enum(WEEK_STARTS),
    timeFormat: z.enum(TIME_FORMATS),
  })
  .partial()
  .refine((patch) => Object.values(patch).some((value) => value !== undefined));

export type SettingsPatch = z.input<typeof UpdateSettingsInput>;
