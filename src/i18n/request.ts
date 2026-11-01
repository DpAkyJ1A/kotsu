import { cookies, headers } from 'next/headers';
import type { Locale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { asMessages, formats, LOCALE_COOKIE, TIME_ZONE } from './config';
import { pickLocale } from './pick-locale';

// One import per language, so a request loads only its own messages
const MESSAGES = {
  en: () => import('../../messages/en.json'),
  ru: () => import('../../messages/ru.json'),
} satisfies Record<Locale, () => Promise<unknown>>;

// What next-intl renders a request with: Server Components read it directly, the root layout's
// NextIntlClientProvider passes it on to Client Components
export default getRequestConfig(async () => {
  const locale = pickLocale({
    cookie: (await cookies()).get(LOCALE_COOKIE)?.value,
    acceptLanguage: (await headers()).get('accept-language'),
  });

  return {
    locale,
    messages: asMessages((await MESSAGES[locale]()).default),
    timeZone: TIME_ZONE,
    formats,
  };
});
