import type { AbstractIntlMessages, Formats, Messages } from 'next-intl';

import type { TimeFormat } from '@/lib/user-settings';

export const DEFAULT_TIME_ZONE = 'UTC';

// Named date formats, from the mockups: `format.dateTime(date, 'dayLong')` in code, `{date, date, dayLong}` in a
// message
export const formats = {
  dateTime: {
    // Wednesday, October 28 — the day view's heading
    dayLong: { weekday: 'long', month: 'long', day: 'numeric' },
    // Tue, Oct 20 — the heatmap's tooltip
    dayShort: { weekday: 'short', month: 'short', day: 'numeric' },
    // Oct 28 — when a token was created
    monthDay: { month: 'short', day: 'numeric' },
    // 17:00 and 09:05: with `hour: 'numeric'` Russian would drop the zero (9:05) and English keep it
    time: { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
  },
} satisfies Formats;

const TWELVE_HOUR_TIME = {
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h12',
} as const;

export function formatsFor(timeFormat: TimeFormat | undefined): Formats {
  if (timeFormat !== 'h12') return formats;
  return { dateTime: { ...formats.dateTime, time: TWELVE_HOUR_TIME } };
}

// `Messages` is typed from the English file down to its exact text, which is how a message's arguments get their
// types, so no other language's file matches it. They all have the same keys: messages.test.ts checks that
export function asMessages(messages: AbstractIntlMessages): Messages {
  return messages as Messages;
}
