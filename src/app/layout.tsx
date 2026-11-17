import './globals.css';

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

import { manrope } from '@/ui/font';
import { THEME_COOKIE, themeFrom } from '@/ui/theme-cookie';

export const metadata: Metadata = {
  title: { default: 'Kotsu', template: '%s · Kotsu' },
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  // Set only when the user picked a theme; without it the CSS follows the system
  const theme = themeFrom((await cookies()).get(THEME_COOKIE)?.value);
  // Picked in src/i18n/request.ts
  const locale = await getLocale();

  return (
    <html lang={locale} className={manrope.variable} data-theme={theme}>
      <body>
        {/* Gives Client Components the language, messages, time zone and formats of the request */}
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
