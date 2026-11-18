'use client';

import { useTranslations } from 'next-intl';
import { startTransition } from 'react';

import { type Theme, THEMES } from '@/lib/user-settings';
import { useAppliedTheme } from '@/ui/apply-theme';
import {
  DropdownMenuSegmentedGroup,
  DropdownMenuSegmentedItem,
} from '@/ui/dropdown-menu';
import { ContrastIcon, MoonIcon, SunIcon } from '@/ui/icons';

import { usePickTheme } from '../hooks/use-pick-theme';

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonIcon,
  system: ContrastIcon,
} satisfies Record<Theme, typeof SunIcon>;

type ThemePickerProps = { theme: Theme };

export function ThemePicker({ theme }: ThemePickerProps) {
  const t = useTranslations('settings');
  const pickTheme = usePickTheme();
  const shownTheme = useAppliedTheme(theme);

  function handlePick(picked: Theme) {
    startTransition(async () => {
      await pickTheme(picked);
    });
  }

  return (
    <DropdownMenuSegmentedGroup aria-label={t('theme')} value={shownTheme}>
      {THEMES.map((option) => {
        const Icon = THEME_ICONS[option];
        return (
          <DropdownMenuSegmentedItem
            key={option}
            value={option}
            onSelect={() => {
              handlePick(option);
            }}
          >
            <Icon />
            {t(option)}
          </DropdownMenuSegmentedItem>
        );
      })}
    </DropdownMenuSegmentedGroup>
  );
}
