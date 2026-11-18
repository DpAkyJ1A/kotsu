import './globals.css';

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

import { THEME_COOKIE, themeAttribute, themeFrom } from '@/lib/theme-cookie';
import { findCtx } from '@/server/ctx/get-ctx';
import { manrope } from '@/ui/font';

export const metadata: Metadata = {
  title: { default: 'Kotsu', template: '%s · Kotsu' },
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const [ctx, cookieStore, locale] = await Promise.all([
    findCtx(),
    cookies(),
    getLocale(),
  ]);
  const theme =
    ctx?.settings.theme ?? themeFrom(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <html
      lang={locale}
      className={manrope.variable}
      data-theme={themeAttribute(theme)}
    >
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
