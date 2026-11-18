import type { Locale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { findCtx, findVisitorLocale } from '@/server/ctx/get-ctx';

import { asMessages, DEFAULT_TIME_ZONE, formatsFor } from './config';

// One import per language, so a request loads only its own messages
const MESSAGES = {
  en: () => import('../../messages/en.json'),
  ru: () => import('../../messages/ru.json'),
} satisfies Record<Locale, () => Promise<unknown>>;

// What next-intl renders a request with: Server Components read it directly, the root layout's
// NextIntlClientProvider passes it on to Client Components
export default getRequestConfig(async () => {
  const settings = (await findCtx())?.settings;
  const locale = settings?.locale ?? (await findVisitorLocale());

  return {
    locale,
    messages: asMessages((await MESSAGES[locale]()).default),
    timeZone: settings?.timezone ?? DEFAULT_TIME_ZONE,
    formats: formatsFor(settings?.timeFormat),
  };
});
