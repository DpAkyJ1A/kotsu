'use client';

import { DropdownMenu, DropdownMenuTrigger } from '@/ui/dropdown-menu';
import { ChevronDownIcon } from '@/ui/icons';

import { type Account, displayName } from '../core/account';
import { AccountMenuContent } from './account-menu-content';
import { Avatar } from './avatar';

type AccountMenuProps = { account: Account };

export function AccountMenu({ account }: AccountMenuProps) {
  const name = displayName(account);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left font-semibold text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=open]:bg-sidebar-accent">
        <Avatar name={name} />
        <span className="truncate">{name}</span>
        <ChevronDownIcon className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <AccountMenuContent account={account} align="start" />
    </DropdownMenu>
  );
}
