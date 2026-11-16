'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/ui/button';

import { type AuthError, authErrorOf } from '../core/auth-error';

export function SignOutButton() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [error, setError] = useState<AuthError | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const failure = await authErrorOf(authClient.signOut());
      setError(failure);
      if (!failure) router.replace('/sign-in');
    });
  }

  return (
    <div className="grid justify-items-center gap-2">
      <Button variant="secondary" onClick={handleClick} disabled={isPending}>
        {t('signOut')}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${error}`)}
        </p>
      )}
    </div>
  );
}
