'use client';

import { useTranslations } from 'next-intl';
import {
  type ReactNode,
  type SubmitEvent,
  useId,
  useState,
  useTransition,
} from 'react';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

import { type AuthError, authErrorOf } from '../core/auth-error';

type ConfirmWithCodeProps = {
  email: string;
  onConfirmed: () => void;
  onCancel: () => void;
};

export function ConfirmWithCode({
  email,
  onConfirmed,
  onCancel,
}: ConfirmWithCodeProps) {
  const t = useTranslations();
  const titleId = useId();
  const messageId = useId();
  const [sentCodes, setSentCodes] = useState(0);
  const [error, setError] = useState<AuthError | null>(null);
  const [isPending, startTransition] = useTransition();
  const strongEmail = (chunks: ReactNode) => (
    <strong className="font-semibold text-foreground">{chunks}</strong>
  );

  function sendCode() {
    startTransition(async () => {
      const failure = await authErrorOf(
        authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' }),
      );
      setError(failure);
      if (!failure) setSentCodes((count) => count + 1);
    });
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = new FormData(event.currentTarget).get('code');
    if (typeof code !== 'string') return;
    startTransition(async () => {
      const failure = await authErrorOf(
        authClient.signIn.emailOtp({ email, otp: code.replace(/\D/g, '') }),
      );
      setError(failure);
      if (!failure) onConfirmed();
    });
  }

  const hasSentCode = sentCodes > 0;
  const isNewCodeSent = sentCodes > 1 && error === null;

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className="grid gap-3 rounded-xl border bg-card p-4"
    >
      <div className="grid gap-1">
        <p id={titleId} className="text-sm font-semibold">
          {t('settings.passkeys.confirmTitle')}
        </p>
        <p className="text-sm text-muted-foreground">
          {t.rich(
            hasSentCode
              ? 'settings.passkeys.codeSent'
              : 'settings.passkeys.confirmDescription',
            { email, strong: strongEmail },
          )}
        </p>
      </div>
      {hasSentCode && (
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <label className="grid flex-1 gap-1.5 text-sm font-medium">
            {t('auth.code')}
            <Input
              ref={focusWhenShown}
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              readOnly={isPending}
              className="font-semibold tracking-widest tabular-nums"
              aria-invalid={error === 'wrongCode'}
              aria-describedby={error || isNewCodeSent ? messageId : undefined}
            />
          </label>
          <Button type="submit" disabled={isPending}>
            {t('settings.passkeys.confirm')}
          </Button>
        </form>
      )}
      {error && (
        <p id={messageId} role="alert" className="text-sm text-destructive">
          {t(`auth.errors.${error}`)}
        </p>
      )}
      {isNewCodeSent && (
        <p
          id={messageId}
          role="status"
          className="text-sm text-muted-foreground"
        >
          {t('auth.newCodeSent')}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={hasSentCode ? 'ghost' : 'primary'}
          size="sm"
          onClick={sendCode}
          disabled={isPending}
        >
          {hasSentCode ? t('auth.sendNewCode') : t('auth.sendCode')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          {t('settings.cancel')}
        </Button>
      </div>
    </div>
  );
}

function focusWhenShown(input: HTMLInputElement | null) {
  input?.focus();
}
