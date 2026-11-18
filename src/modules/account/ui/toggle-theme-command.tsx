'use client';

import { useTranslations } from 'next-intl';
import { startTransition } from 'react';

import { visibleTheme } from '@/ui/apply-theme';
import { CommandPaletteItem } from '@/ui/command-palette';
import { ContrastIcon } from '@/ui/icons';

import { usePickTheme } from '../hooks/use-pick-theme';

export function ToggleThemeCommand() {
  const t = useTranslations('settings');
  const pickTheme = usePickTheme();

  function handleToggle() {
    startTransition(async () => {
      await pickTheme(visibleTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  return (
    <CommandPaletteItem keywords={[t('themeKeywords')]} onSelect={handleToggle}>
      <ContrastIcon />
      {t('toggleTheme')}
    </CommandPaletteItem>
  );
}
