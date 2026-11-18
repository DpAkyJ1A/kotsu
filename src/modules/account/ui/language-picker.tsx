'use client';

import { type Locale, useTranslations } from 'next-intl';

import { LOCALES } from '@/lib/user-settings';
import {
  DropdownMenuSegmentedGroup,
  DropdownMenuSegmentedItem,
} from '@/ui/dropdown-menu';

import { LANGUAGE_NAMES } from '../core/language-names';
import { useOptimisticSetting } from '../hooks/use-optimistic-setting';

type LanguagePickerProps = { locale: Locale };

export function LanguagePicker({ locale }: LanguagePickerProps) {
  const t = useTranslations('settings');
  const language = useOptimisticSetting(locale, (picked) => ({
    locale: picked,
  }));

  return (
    <DropdownMenuSegmentedGroup
      aria-label={t('language')}
      value={language.shown}
    >
      {LOCALES.map((option) => (
        <DropdownMenuSegmentedItem
          key={option}
          value={option}
          lang={option}
          onSelect={() => {
            language.pick(option);
          }}
        >
          {LANGUAGE_NAMES[option]}
        </DropdownMenuSegmentedItem>
      ))}
    </DropdownMenuSegmentedGroup>
  );
}
