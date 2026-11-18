'use client';

import { useTranslations } from 'next-intl';

import { CommandPaletteItem } from '@/ui/command-palette';
import { SettingsIcon } from '@/ui/icons';

import { openSettingsDialog } from '../hooks/settings-history';

export function OpenSettingsCommand() {
  const t = useTranslations('settings');

  return (
    <CommandPaletteItem
      onSelect={() => {
        openSettingsDialog('account');
      }}
    >
      <SettingsIcon />
      {t('title')}
    </CommandPaletteItem>
  );
}
