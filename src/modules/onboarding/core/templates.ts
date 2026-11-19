import type { Locale } from 'next-intl';

import type { Templates } from './template';
import { en } from './templates/en';
import { ru } from './templates/ru';

const TEMPLATES: Record<Locale, Templates> = { en, ru };

export function templatesIn(locale: Locale): Templates {
  return TEMPLATES[locale];
}
