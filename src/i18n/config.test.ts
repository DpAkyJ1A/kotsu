import { createFormatter, type Formats, type Locale } from 'next-intl';
import { describe, expect, test } from 'vitest';

import { DEFAULT_TIME_ZONE, formats, formatsFor } from './config';

// What `useFormatter()` and `getFormatter()` return in the app for a language
const formatter = (locale: Locale, timeFormats: Formats = formats) =>
  createFormatter({
    locale,
    timeZone: DEFAULT_TIME_ZONE,
    formats: timeFormats,
  });

// Tuesday, 3 November 2026
const EVENING = new Date('2026-11-03T18:05:00Z');
const MORNING = new Date('2026-11-03T09:05:00Z');

describe('date formats', () => {
  test.each([
    ['en', 'dayLong', 'Tuesday, November 3'],
    ['ru', 'dayLong', 'вторник, 3 ноября'],
    ['en', 'dayShort', 'Tue, Nov 3'],
    ['ru', 'dayShort', 'вт, 3 нояб.'],
    ['en', 'monthDay', 'Nov 3'],
    ['ru', 'monthDay', '3 нояб.'],
    ['en', 'time', '18:05'],
    ['ru', 'time', '18:05'],
  ] as const)('%s %s: %s', (locale, format, expected) => {
    expect(formatter(locale).dateTime(EVENING, format)).toBe(expected);
  });

  test.each(['en', 'ru'] as const)(
    'a time is 24-hour with a leading zero in %s',
    (locale) => {
      expect(formatter(locale).dateTime(MORNING, 'time')).toBe('09:05');
    },
  );
});

describe('time format setting', () => {
  test.each(['en', 'ru'] as const)(
    '12-hour time in %s has AM and PM and no leading zero',
    (locale) => {
      const format = formatter(locale, formatsFor('h12'));

      expect(format.dateTime(EVENING, 'time')).toBe('6:05 PM');
      expect(format.dateTime(MORNING, 'time')).toBe('9:05 AM');
    },
  );

  test.each(['h24', undefined] as const)(
    '%s keeps the 24-hour time',
    (timeFormat) => {
      expect(formatsFor(timeFormat)).toBe(formats);
    },
  );

  test('the other formats stay as they are in 12-hour time', () => {
    const format = formatter('en', formatsFor('h12'));

    expect(format.dateTime(EVENING, 'dayLong')).toBe('Tuesday, November 3');
  });
});

// Russian groups digits and spaces off the percent sign with a no-break space, so text assertions need `\u00a0`
describe('numbers', () => {
  test.each([
    ['en', '12,345.6', '34%'],
    ['ru', '12\u00a0345,6', '34\u00a0%'],
  ] as const)('%s: %s and %s', (locale, number, percent) => {
    const format = formatter(locale);

    expect(format.number(12_345.6)).toBe(number);
    expect(format.number(0.34, { style: 'percent' })).toBe(percent);
  });
});
