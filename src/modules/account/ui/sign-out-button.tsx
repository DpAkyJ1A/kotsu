'use client';

import { cn } from 'cn';
import { useTranslations } from 'next-intl';

import { LogOutIcon } from '@/ui/icons';

import { useSignOut } from '../hooks/use-sign-out';

type SignOutButtonProps = { className?: string };

export function SignOutButton({ className }: SignOutButtonProps) {
  const t = useTranslations('auth');
  const { signOut, isPending } = useSignOut();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={signOut}
      className={cn(
        'flex items-center gap-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50',
        className,
      )}
    >
      <LogOutIcon />
      {t('signOut')}
    </button>
  );
}
