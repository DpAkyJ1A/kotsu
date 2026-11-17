'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/ui/button';

import { authErrorOf } from '../core/auth-error';

type PasskeyOfferProps = { onAnswer: () => Promise<void> };

export function PasskeyOffer({ onAnswer }: PasskeyOfferProps) {
  const t = useTranslations('auth');
  const [isFailed, setIsFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleTurnOn() {
    startTransition(async () => {
      const failure = await authErrorOf(
        authClient.passkey.addPasskey({ authenticatorAttachment: 'platform' }),
      );
      const hasPasskeyHere = failure === null || failure === 'passkeyExists';
      setIsFailed(!hasPasskeyHere);
      if (hasPasskeyHere) await onAnswer();
    });
  }

  return (
    <div className="grid gap-4">
      {isFailed && (
        <p role="alert" className="text-sm text-destructive">
          {t('errors.passkeyNotAdded')}
        </p>
      )}
      <Button size="lg" onClick={handleTurnOn} disabled={isPending}>
        {t('turnOnPasskey')}
      </Button>
      <form action={onAnswer} className="grid">
        <Button type="submit" variant="ghost" size="lg" disabled={isPending}>
          {t('notNow')}
        </Button>
      </form>
    </div>
  );
}
