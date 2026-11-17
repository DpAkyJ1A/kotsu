'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type SubmitEvent, useId, useState, useTransition } from 'react';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

import { type AuthError, authErrorOf } from '../core/auth-error';
import { codePagePath } from '../core/sign-in-paths';
import { usePasskeyAutofill } from '../hooks/use-passkey-autofill';

type EmailFormProps = { next: Route };

export function EmailForm({ next }: EmailFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const errorId = useId();
  const [error, setError] = useState<AuthError | null>(null);
  const [isPending, startTransition] = useTransition();
  const passkeyError = usePasskeyAutofill(next);
  const shownError = error ?? passkeyError;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    if (typeof email !== 'string') return;
    startTransition(async () => {
      const failure = await authErrorOf(
        authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' }),
      );
      setError(failure);
      if (!failure) router.push(codePagePath(email, next));
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="grid gap-1.5 text-sm font-medium">
        {t('email')}
        <Input
          type="email"
          name="email"
          autoComplete="username webauthn"
          required
          aria-invalid={error === 'invalidEmail'}
          aria-describedby={shownError ? errorId : undefined}
        />
      </label>
      {shownError && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {t(`errors.${shownError}`)}
        </p>
      )}
      <Button type="submit" size="lg" disabled={isPending}>
        {t('sendCode')}
      </Button>
    </form>
  );
}
