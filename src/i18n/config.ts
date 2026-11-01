import type { AbstractIntlMessages, Formats, Messages } from 'next-intl';

export const LOCALES = ['en', 'ru'] as const;

export const DEFAULT_LOCALE = 'en';

// Set only when the user picked a language; without it the browser's languages decide
export const LOCALE_COOKIE = 'locale';

// The default of `user_settings.timezone`. Fixed, so the server and the browser format a date the same way
export const TIME_ZONE = 'UTC';

// Named date formats, from the mockups: `format.dateTime(date, 'dayLong')` in code, `{date, date, dayLong}` in a
// message. Times are 24-hour in every language, the default of `user_settings.time_format`
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

// `Messages` is typed from the English file down to its exact text, which is how a message's arguments get their
// types, so no other language's file matches it. They all have the same keys: messages.test.ts checks that
export function asMessages(messages: AbstractIntlMessages): Messages {
  return messages as Messages;
}
