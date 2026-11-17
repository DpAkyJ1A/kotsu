'use client';

import { cn } from 'cn';

import { DropdownMenu, DropdownMenuTrigger } from '@/ui/dropdown-menu';

import { type Account, displayName } from '../core/account';
import { AccountMenuContent } from './account-menu-content';
import { Avatar } from './avatar';

type AccountAvatarMenuProps = { account: Account; className?: string };

export function AccountAvatarMenu({
  account,
  className,
}: AccountAvatarMenuProps) {
  const name = displayName(account);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={name}
        className={cn(
          '-mr-1 rounded-full p-1 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=open]:bg-accent',
          className,
        )}
      >
        <Avatar name={name} size="lg" />
      </DropdownMenuTrigger>
      <AccountMenuContent account={account} align="end" />
    </DropdownMenu>
  );
}
