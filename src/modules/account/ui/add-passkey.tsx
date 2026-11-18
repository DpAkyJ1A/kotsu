'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition } from 'react';
import { flushSync } from 'react-dom';

import { Button } from '@/ui/button';
import { PlusIcon } from '@/ui/icons';

import { useAddPasskey } from '../hooks/use-add-passkey';
import { ConfirmWithCode } from './confirm-with-code';

type Step = 'add' | 'confirm' | 'confirmed';

type AddPasskeyProps = { email: string };

export function AddPasskey({ email }: AddPasskeyProps) {
  const t = useTranslations('settings.passkeys');
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<Step>('add');
  const [isPending, startTransition] = useTransition();
  const addPasskey = useAddPasskey();

  function add() {
    startTransition(async () => {
      const outcome = await addPasskey();
      setStep(outcome === 'needsConfirmation' ? 'confirm' : 'add');
    });
  }

  function handleConfirmed() {
    flushSync(() => {
      setStep('confirmed');
    });
    addButtonRef.current?.focus();
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          ref={addButtonRef}
          variant={step === 'confirmed' ? 'primary' : 'secondary'}
          onClick={add}
          disabled={isPending || step === 'confirm'}
        >
          <PlusIcon />
          {t('add')}
        </Button>
        {step === 'confirmed' && (
          <p role="status" className="text-sm text-muted-foreground">
            {t('confirmed')}
          </p>
        )}
      </div>
      {step === 'confirm' && (
        <ConfirmWithCode
          email={email}
          onConfirmed={handleConfirmed}
          onCancel={() => {
            setStep('add');
          }}
        />
      )}
    </div>
  );
}
