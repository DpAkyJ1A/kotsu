import './globals.css';

import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { cookies } from 'next/headers';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata: Metadata = {
  title: 'Kotsu',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  // Set only when the user picked a theme; without it the CSS follows the system
  const theme = (await cookies()).get('theme')?.value;

  return (
    <html
      lang="en"
      className={manrope.variable}
      data-theme={theme === 'light' || theme === 'dark' ? theme : undefined}
    >
      <body>{children}</body>
    </html>
  );
}
