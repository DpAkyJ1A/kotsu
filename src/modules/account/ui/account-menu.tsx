'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { authClient } from '@/lib/auth-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { ChevronDownIcon, LogOutIcon } from '@/ui/icons';
import { toast } from '@/ui/toast';

import { type Account, displayName } from '../core/account';
import { authErrorOf } from '../core/auth-error';

type AccountMenuProps = { account: Account };

export function AccountMenu({ account }: AccountMenuProps) {
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
        <DropdownMenuItem disabled={isPending} onSelect={handleSignOut}>
          <LogOutIcon />
          {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const avatarVariants = cva(
  'grid shrink-0 place-items-center rounded-full bg-violet font-semibold text-violet-foreground',
  {
    variants: {
      size: {
        md: 'size-6 text-xs',
        lg: 'size-9 text-sm',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

type AvatarProps = VariantProps<typeof avatarVariants> & { name: string };

function Avatar({ name, size }: AvatarProps) {
  return (
    <span aria-hidden className={avatarVariants({ size })}>
      {Array.from(name)[0]?.toUpperCase()}
    </span>
  );
}
