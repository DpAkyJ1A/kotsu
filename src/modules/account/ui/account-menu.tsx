'use client';

import { useTranslations } from 'next-intl';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { ChevronDownIcon, LogOutIcon, SettingsIcon } from '@/ui/icons';
import { isApplePlatform } from '@/ui/shortcut';

import { type Account, displayName } from '../core/account';
import type { Settings } from '../core/settings';
import { openSettingsDialog } from '../hooks/settings-history';
import { useSignOut } from '../hooks/use-sign-out';
import { Avatar } from './avatar';
import { LanguagePicker } from './language-picker';
import { ThemePicker } from './theme-picker';

type AccountMenuProps = { account: Account; settings: Settings };

export function AccountMenu({ account, settings }: AccountMenuProps) {
  const t = useTranslations();
  const { signOut, isPending } = useSignOut();
  const name = displayName(account);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left font-semibold text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=open]:bg-sidebar-accent">
        <Avatar name={name} />
        <span className="truncate">{name}</span>
        <ChevronDownIcon className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 font-normal">
          <Avatar name={name} size="lg" />
          <span className="grid min-w-0">
            <span className="truncate text-sm font-semibold text-popover-foreground">
              {name}
            </span>
            <span className="truncate">{account.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ThemePicker theme={settings.theme} />
        <LanguagePicker locale={settings.locale} />
        <DropdownMenuSeparator />
        <SettingsItem />
        <DropdownMenuItem disabled={isPending} onSelect={signOut}>
          <LogOutIcon />
          {t('auth.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SettingsItem() {
  const t = useTranslations('settings');
  const isApple = isApplePlatform(navigator.userAgent);

  return (
    <DropdownMenuItem
      aria-keyshortcuts={isApple ? 'Meta+Comma' : 'Control+Comma'}
      onSelect={() => {
        openSettingsDialog('account');
      }}
    >
      <SettingsIcon />
      {t('title')}
      <DropdownMenuShortcut aria-hidden>
        {isApple ? '⌘,' : 'Ctrl ,'}
      </DropdownMenuShortcut>
    </DropdownMenuItem>
  );
}
