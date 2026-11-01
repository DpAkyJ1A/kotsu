import type messages from '../../messages/en.json';
import type { formats, LOCALES } from './config';

// Types next-intl's API with Kotsu's languages, message keys and their arguments, and format names:
// `useTranslations('home')('nope')` or `format.dateTime(date, 'nope')` fails the typecheck
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof LOCALES)[number];
    Messages: typeof messages;
    Formats: typeof formats;
  }
}
