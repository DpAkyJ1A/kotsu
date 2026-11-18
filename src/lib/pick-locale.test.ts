import { describe, expect, test } from 'vitest';

import { pickLocale } from './pick-locale';

const fromBrowser = (acceptLanguage: string | null) =>
  pickLocale({ cookie: undefined, acceptLanguage });

describe('with no language picked', () => {
  test.each([
    ['ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7', 'ru'],
    ['en-GB,en;q=0.9', 'en'],
    ['RU', 'ru'],
    // The first language Kotsu speaks, past the ones it doesn't
    ['de-DE,de;q=0.9,ru;q=0.8,en;q=0.7', 'ru'],
    // Weights decide, not the order in the header
    ['en;q=0.5,ru;q=0.9', 'ru'],
    // Of two equal weights, the one listed first
    ['ru;q=0.8,en;q=0.8', 'ru'],
    // q=0 means "not this one"
    ['ru;q=0,en;q=0.5', 'en'],
    ['ru;q=abc,en;q=0.5', 'en'],
    [' ru-RU ; q=0.9 ', 'ru'],
  ])('reads %j as %s', (header, locale) => {
    expect(fromBrowser(header)).toBe(locale);
  });

  test.each([null, '', '*', 'de-DE,fr;q=0.9', 'ru;q=0'])(
    'falls back to English for %j',
    (header) => {
      expect(fromBrowser(header)).toBe('en');
    },
  );
});

describe('with a language picked', () => {
  test('wins over the browser', () => {
    expect(pickLocale({ cookie: 'en', acceptLanguage: 'ru' })).toBe('en');
    expect(pickLocale({ cookie: 'ru', acceptLanguage: 'en' })).toBe('ru');
  });

  test('is ignored when Kotsu does not speak it', () => {
    expect(pickLocale({ cookie: 'de', acceptLanguage: 'ru' })).toBe('ru');
    expect(pickLocale({ cookie: 'RU', acceptLanguage: null })).toBe('en');
  });
});
