import '@/app/globals.css';

import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/nextjs-vite';
import { hasLocale } from 'next-intl';
import { sb } from 'storybook/test';

import { DEFAULT_TIME_ZONE } from '@/i18n/config';
import { IntlTestProvider } from '@/i18n/testing';
import { LOCALES } from '@/lib/user-settings';
import { manrope } from '@/ui/font';

sb.mock('../src/lib/auth-client.ts');
sb.mock('../src/modules/account/actions.ts');

const preview: Preview = {
  decorators: [
    // The theme switch in the toolbar sets data-theme on <html>, as the `theme` cookie does in the app
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
    // The language switch in the toolbar gives the components that language's messages and sets lang on <html>,
    // as the root layout does; a story can pin a `timeZone` global
    (Story, { globals }) => {
      const locale = hasLocale(LOCALES, globals.locale) ? globals.locale : 'en';
      const timeZone =
        typeof globals.timeZone === 'string'
          ? globals.timeZone
          : DEFAULT_TIME_ZONE;
      document.documentElement.lang = locale;
      return (
        <IntlTestProvider locale={locale} timeZone={timeZone}>
          <Story />
        </IntlTestProvider>
      );
    },
  ],
  globalTypes: {
    locale: {
      description: 'Language',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'ru', title: 'Русский' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { locale: 'en' },
  parameters: {
    // An accessibility violation fails the story's test instead of only showing in the panel
    a11y: { test: 'error' },
  },
  beforeAll() {
    // As in the root layout: theme.css reads the font from a variable set on <html>
    document.documentElement.classList.add(manrope.variable);
  },
};

export default preview;
