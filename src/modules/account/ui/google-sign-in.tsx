'use client';

import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { useId, useState, useTransition } from 'react';

import { authClient } from '@/lib/auth-client';
import { signInPath } from '@/lib/sign-in-path';
import { Button } from '@/ui/button';

import { type AuthError, authErrorOf } from '../core/auth-error';
import { pageAfterSignIn } from '../hooks/page-after-sign-in';
import { GoogleLogo } from './google-logo';

type GoogleSignInProps = { next: Route; hasFailed: boolean };

export function GoogleSignIn({ next, hasFailed }: GoogleSignInProps) {
  const t = useTranslations('auth');
  const errorId = useId();
  const [error, setError] = useState<AuthError | null>(
    hasFailed ? 'googleFailed' : null,
  );
  const [isPending, startTransition] = useTransition();

  function signIn() {
    startTransition(async () => {
      const failure = await authErrorOf(
        authClient.signIn.social({
          provider: 'google',
          callbackURL: await pageAfterSignIn(next),
          errorCallbackURL: signInPath(next),
        }),
      );
      setError(failure);
    });
  }

  return (
    <div className="grid gap-2">
      <Button
        variant="secondary"
        size="lg"
        onClick={signIn}
        disabled={isPending}
        aria-describedby={error ? errorId : undefined}
      >
        <GoogleLogo className="size-5" />
        {t('continueWithGoogle')}
      </Button>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {t(`errors.${error}`)}
        </p>
      )}
    </div>
  );
}
