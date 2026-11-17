'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  type ChangeEvent,
  type SubmitEvent,
  useId,
  useRef,
  useState,
  useTransition,
} from 'react';

import {
  authClient,
  platformAuthenticatorIsAvailable,
} from '@/lib/auth-client';
import { signInPath } from '@/lib/sign-in-path';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

import { type AuthError, authErrorOf } from '../core/auth-error';
import { passkeyOfferPath } from '../core/sign-in-paths';

const CODE_LENGTH = 6;

type CodeFormProps = { email: string; next: Route };

export function CodeForm({ email, next }: CodeFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const messageId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const lastCodeRef = useRef('');
  const [error, setError] = useState<AuthError | null>(null);
  const [isNewCodeSent, setIsNewCodeSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function signIn(otp: string) {
    startTransition(async () => {
      const failure = await authErrorOf(
        authClient.signIn.emailOtp({ email, otp }),
      );
      setError(failure);
      setIsNewCodeSent(false);
      if (!failure) router.replace(await pageAfterSignIn(next));
    });
  }

  function sendNewCode() {
    startTransition(async () => {
      const failure = await authErrorOf(
        authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' }),
      );
      setError(failure);
      setIsNewCodeSent(!failure);
      formRef.current?.reset();
      lastCodeRef.current = '';
    });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const code = input.value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    const isNewFullCode =
      code.length === CODE_LENGTH && code !== lastCodeRef.current;
    input.value = code;
    lastCodeRef.current = code;
    setError(null);
    setIsNewCodeSent(false);
    if (isNewFullCode && !isPending) signIn(code);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = new FormData(event.currentTarget).get('code');
    if (typeof code === 'string' && !isPending) signIn(code);
  }

  const hasMessage = error !== null || isNewCodeSent;

  return (
    <div className="grid gap-4">
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium">
          {t('code')}
          <Input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern={`\\d{${String(CODE_LENGTH)}}`}
            required
            readOnly={isPending}
            onChange={handleChange}
            className="text-center font-semibold tracking-widest tabular-nums"
            aria-invalid={error === 'wrongCode'}
            aria-describedby={hasMessage ? messageId : undefined}
          />
        </label>
        {error && (
          <p id={messageId} role="alert" className="text-sm text-destructive">
            {t(`errors.${error}`)}
          </p>
        )}
        {isNewCodeSent && (
          <p
            id={messageId}
            role="status"
            className="text-sm text-muted-foreground"
          >
            {t('newCodeSent')}
          </p>
        )}
        <Button type="submit" size="lg" disabled={isPending}>
          {t('signIn')}
        </Button>
      </form>
      <div className="flex flex-wrap justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={sendNewCode}
          disabled={isPending}
        >
          {t('sendNewCode')}
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={signInPath(next)}>{t('useAnotherEmail')}</Link>
        </Button>
      </div>
    </div>
  );
}

async function pageAfterSignIn(next: Route) {
  const canOfferPasskey = await platformAuthenticatorIsAvailable().catch(
    () => false,
  );
  return canOfferPasskey ? passkeyOfferPath(next) : next;
}
