'use client';

import { useTranslations } from 'next-intl';
import { useId, useRef, useState, useTransition } from 'react';
import { flushSync } from 'react-dom';

import { Button } from '@/ui/button';

import type { GoogleLink, GoogleLinkError } from '../core/google-link';
import { connectGoogle } from '../hooks/connect-google';
import { useDisconnectGoogle } from '../hooks/use-disconnect-google';
import { useReturnedGoogleError } from '../hooks/use-returned-google-error';
import { ConfirmWithCode } from './confirm-with-code';
import { GoogleLogo } from './google-logo';

type GoogleLinkSettingsProps = {
  email: string;
  link: Exclude<GoogleLink, { status: 'off' }>;
};

export function GoogleLinkSettings({ email, link }: GoogleLinkSettingsProps) {
  const t = useTranslations('settings.google');
  const headingId = useId();
  const errorId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const returnedError = useReturnedGoogleError();
  const [error, setError] = useState<GoogleLinkError | null>(returnedError);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const disconnectGoogle = useDisconnectGoogle();
  const isConnected = link.status === 'connected';

  function connectOrDisconnect() {
    if (isPending) return;
    startTransition(async () => {
      if (link.status === 'notConnected') {
        setError(await connectGoogle());
        return;
      }
      const outcome = await disconnectGoogle(link.accountIds);
      setIsConfirming(outcome === 'needsConfirmation');
      setError(outcome === 'failed' ? 'disconnectFailed' : null);
    });
  }

  function closeConfirmation() {
    flushSync(() => {
      setIsConfirming(false);
    });
    buttonRef.current?.focus();
  }

  function handleConfirmed() {
    closeConfirmation();
    connectOrDisconnect();
  }

  return (
    <section aria-labelledby={headingId} className="grid gap-3">
      <h3 id={headingId} className="text-sm font-semibold">
        {t('title')}
      </h3>
      <div className="flex items-center gap-3 rounded-xl border p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
          <GoogleLogo className="size-4.5" />
        </span>
        <span className="grid min-w-0 flex-1">
          <span className="text-sm font-semibold">
            {isConnected ? t('connected') : t('notConnected')}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {email}
          </span>
        </span>
        <Button
          ref={buttonRef}
          variant="secondary"
          size="sm"
          onClick={connectOrDisconnect}
          disabled={isConfirming}
          aria-disabled={isPending}
          aria-describedby={error ? errorId : undefined}
          className="aria-disabled:opacity-50"
        >
          {isConnected ? t('disconnect') : t('connect')}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {t(`errors.${error}`, { email })}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {isConnected ? t('connectedHint') : t('notConnectedHint')}
      </p>
      {isConfirming && isConnected && (
        <ConfirmWithCode
          purpose="disconnectGoogle"
          email={email}
          onConfirmed={handleConfirmed}
          onCancel={closeConfirmation}
        />
      )}
    </section>
  );
}
