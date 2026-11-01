import { hasLocale, type Locale } from 'next-intl';

import { DEFAULT_LOCALE, LOCALES } from './config';

type PickLocaleOptions = {
  cookie: string | undefined;
  acceptLanguage: string | null;
};

// The language the user picked, else the first of the browser's languages that Kotsu speaks, else English
export function pickLocale({
  cookie,
  acceptLanguage,
}: PickLocaleOptions): Locale {
  if (hasLocale(LOCALES, cookie)) return cookie;
  return preferredLocale(acceptLanguage ?? '') ?? DEFAULT_LOCALE;
}

type LanguageRange = { language: string; quality: number };

// `Accept-Language: de-DE,de;q=0.9,ru;q=0.8` → `ru`. A region doesn't matter: `ru-UA` is `ru`
function preferredLocale(header: string): Locale | undefined {
  return (
    header
      .split(',')
      .map(parseRange)
      .filter((range) => range.quality > 0)
      // A stable sort, so of two equal ranges the one listed first wins
      .sort((a, b) => b.quality - a.quality)
      .map((range) => range.language)
      .find((language) => hasLocale(LOCALES, language))
  );
}

// `ru-RU;q=0.8` → { language: 'ru', quality: 0.8 }. No `q` means 1; a broken one, 0, so the range is dropped
function parseRange(range: string): LanguageRange {
  const [tag = '', ...params] = range.split(';').map((part) => part.trim());
  const [language = ''] = tag.toLowerCase().split('-');
  const q = params.find((param) => param.startsWith('q='));
  const quality = q === undefined ? 1 : Number(q.slice(2));

  return { language, quality: Number.isNaN(quality) ? 0 : quality };
}
