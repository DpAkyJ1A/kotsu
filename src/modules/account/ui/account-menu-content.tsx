'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { authClient } from '@/lib/auth-client';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/ui/dropdown-menu';
import { LogOutIcon } from '@/ui/icons';
import { toast } from '@/ui/toast';

import { type Account, displayName } from '../core/account';
import { authErrorOf } from '../core/auth-error';
import type { Settings } from '../core/settings';
import { Avatar } from './avatar';
import { LanguagePicker } from './language-picker';
import { ThemePicker } from './theme-picker';

type AccountMenuContentProps = {
  account: Account;
  settings: Settings;
  align: 'start' | 'end';
};

export function AccountMenuContent({
  account,
  settings,
  align,
}: AccountMenuContentProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const name = displayName(account);

  function handleSignOut() {
    startTransition(async () => {
      const failure = await authErrorOf(authClient.signOut());
      if (failure) toast.error(t(`errors.${failure}`));
      else router.replace('/sign-in');
    });
  }

  return (
    <DropdownMenuContent align={align} className="w-64">
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
      <DropdownMenuItem disabled={isPending} onSelect={handleSignOut}>
        <LogOutIcon />
        {t('signOut')}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
