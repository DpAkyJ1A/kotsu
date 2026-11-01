import type { Locale } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import { IntlTestProvider } from '@/i18n/testing';

import HomePage from './page';

const renderIn = (locale: Locale) =>
  render(<HomePage />, {
    wrapper: ({ children }) => (
      <IntlTestProvider locale={locale}>{children}</IntlTestProvider>
    ),
  });

test('home page renders its main landmark', async () => {
  const screen = await renderIn('en');

  await expect.element(screen.getByRole('main')).toBeInTheDocument();
});

test.each([
  ['en', /^Open-source workspace/],
  ['ru', /^Рабочее пространство с открытым кодом/],
] as const)('home page speaks %s', async (locale, tagline) => {
  const screen = await renderIn(locale);

  await expect
    .element(screen.getByRole('heading', { level: 1 }))
    .toHaveTextContent('Kotsu');
  await expect.element(screen.getByText(tagline)).toBeInTheDocument();
});
