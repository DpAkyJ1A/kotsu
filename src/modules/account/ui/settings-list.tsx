import { cn } from 'cn';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import {
  ChevronRightIcon,
  FingerprintPatternIcon,
  HardDriveIcon,
  PaletteIcon,
} from '@/ui/icons';

import { type Account, displayName } from '../core/account';
import { LANGUAGE_NAMES } from '../core/language-names';
import type { Settings } from '../core/settings';
import { settingsPagePath } from '../core/settings-sections';
import { Avatar } from './avatar';
import { SignOutButton } from './sign-out-button';

const GROUP_CLASS_NAME = 'overflow-hidden rounded-xl border bg-card';

const ROW_CLASS_NAME =
  'flex w-full items-center gap-3 px-4 text-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&>svg]:size-4.5 [&>svg]:shrink-0';

type SettingsListProps = { account: Account; settings: Settings };

export function SettingsList({ account, settings }: SettingsListProps) {
  const t = useTranslations('settings');
  const name = displayName(account);

  return (
    <div className="grid gap-2 px-6 pb-8 md:max-w-lg">
      <ul className={GROUP_CLASS_NAME}>
        <li>
          <Link
            href={settingsPagePath('account')}
            className={cn(ROW_CLASS_NAME, 'py-3')}
          >
            <Avatar name={name} size="lg" />
            <span className="grid min-w-0 flex-1">
              <span className="truncate font-semibold">{name}</span>
              <span className="truncate text-muted-foreground">
                {account.email}
              </span>
            </span>
            <ChevronRightIcon className="text-muted-foreground" />
          </Link>
        </li>
      </ul>
      <ul className={GROUP_CLASS_NAME}>
        <li>
          <Link
            href={settingsPagePath('appearance')}
            className={cn(ROW_CLASS_NAME, 'h-12')}
          >
            <PaletteIcon className="text-muted-foreground" />
            <span className="flex-1">{t('sections.appearance.title')}</span>
            <span className="truncate text-muted-foreground">
              {t('appearanceSummary', {
                theme: t(settings.theme),
                language: LANGUAGE_NAMES[settings.locale],
              })}
            </span>
            <ChevronRightIcon className="text-muted-foreground" />
          </Link>
        </li>
      </ul>
      <ul className={GROUP_CLASS_NAME}>
        <li>
          <Link
            href={settingsPagePath('security')}
            className={cn(ROW_CLASS_NAME, 'h-12')}
          >
            <FingerprintPatternIcon className="text-muted-foreground" />
            <span className="flex-1">{t('sections.security.title')}</span>
            <ChevronRightIcon className="text-muted-foreground" />
          </Link>
        </li>
      </ul>
      <ul className={GROUP_CLASS_NAME}>
        <li>
          <Link
            href={settingsPagePath('storage')}
            className={cn(ROW_CLASS_NAME, 'h-12')}
          >
            <HardDriveIcon className="text-muted-foreground" />
            <span className="flex-1">{t('sections.storage.title')}</span>
            <ChevronRightIcon className="text-muted-foreground" />
          </Link>
        </li>
      </ul>
      <div className={GROUP_CLASS_NAME}>
        <SignOutButton
          className={cn(ROW_CLASS_NAME, 'h-12 text-destructive')}
        />
      </div>
    </div>
  );
}
