import './globals.css';

import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

import { themeColors } from '@/lib/theme-color';
import { THEME_COOKIE, themeAttribute, themeFrom } from '@/lib/theme-cookie';
import { findCtx } from '@/server/ctx/get-ctx';
import { manrope } from '@/ui/font';

export const metadata: Metadata = {
  title: { default: 'Kotsu', template: '%s · Kotsu' },
};

export async function generateViewport(): Promise<Viewport> {
  return {
    viewportFit: 'cover',
    themeColor: themeColors(await loadTheme()),
  };
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const [theme, locale] = await Promise.all([loadTheme(), getLocale()]);

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

async function loadTheme() {
  const [ctx, cookieStore] = await Promise.all([findCtx(), cookies()]);
  return ctx?.settings.theme ?? themeFrom(cookieStore.get(THEME_COOKIE)?.value);
}
