'use client';

import { type Locale, useTranslations } from 'next-intl';
import { startTransition, useOptimistic } from 'react';

import { LOCALES } from '@/lib/user-settings';
import {
  DropdownMenuSegmentedGroup,
  DropdownMenuSegmentedItem,
} from '@/ui/dropdown-menu';

import { useUpdateSettings } from '../hooks/use-update-settings';

const LANGUAGE_NAMES = {
  en: 'English',
  ru: 'Русский',
} satisfies Record<Locale, string>;

type LanguagePickerProps = { locale: Locale };

export function LanguagePicker({ locale }: LanguagePickerProps) {
  const t = useTranslations('settings');
  const updateSettings = useUpdateSettings();
  const [shownLocale, setShownLocale] = useOptimistic(locale);

  function handlePick(picked: Locale) {
    startTransition(async () => {
      setShownLocale(picked);
      await updateSettings({ locale: picked });
    });
  }

  return (
    <DropdownMenuSegmentedGroup aria-label={t('language')} value={shownLocale}>
      {LOCALES.map((option) => (
        <DropdownMenuSegmentedItem
          key={option}
          value={option}
          lang={option}
          onSelect={() => {
            handlePick(option);
          }}
        >
          {LANGUAGE_NAMES[option]}
        </DropdownMenuSegmentedItem>
      ))}
    </DropdownMenuSegmentedGroup>
  );
}
