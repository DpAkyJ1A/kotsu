import type { Locale, Messages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

import en from '../../messages/en.json';
import ru from '../../messages/ru.json';
import { asMessages, formats, TIME_ZONE } from './config';

// Every language at once: fine for stories and tests, while the app loads one per request (request.ts)
const MESSAGES: Record<Locale, Messages> = {
  en: asMessages(en),
  ru: asMessages(ru),
};

type IntlTestProviderProps = {
  locale?: Locale;
  children: ReactNode;
};

// What the root layout's provider gives a component in the app, for Storybook and the component tests, which
// render without a request
export function IntlTestProvider({
  locale = 'en',
  children,
}: IntlTestProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone={TIME_ZONE}
      formats={formats}
    >
      {children}
    </NextIntlClientProvider>
  );
}
