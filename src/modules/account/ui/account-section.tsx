'use client';

import { useTranslations } from 'next-intl';
import { type SubmitEvent, useId, useState, useTransition } from 'react';

import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

import { type Account, emailName } from '../core/account';
import { useSaveName } from '../hooks/use-save-name';

const NAME_MAX_LENGTH = 100;

type AccountSectionProps = { account: Account };

export function AccountSection({ account }: AccountSectionProps) {
  const t = useTranslations('settings');
  const nameId = useId();
  const [name, setName] = useState(account.name);
  const [isPending, startTransition] = useTransition();
  const saveName = useSaveName();
  const isChanged = name.trim() !== account.name;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      await saveName(name.trim());
    });
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="grid gap-2 border-b pb-4">
        <label htmlFor={nameId} className="text-sm font-semibold">
          {t('name')}
        </label>
        <div className="flex gap-2">
          <Input
            id={nameId}
            value={name}
            placeholder={emailName(account.email)}
            autoComplete="name"
            maxLength={NAME_MAX_LENGTH}
            onChange={(event) => {
              setName(event.currentTarget.value);
            }}
          />
          <Button type="submit" disabled={!isChanged || isPending}>
            {t('save')}
          </Button>
        </div>
      </form>
      <dl className="grid gap-1 py-4 text-sm">
        <dt className="font-semibold">{t('email')}</dt>
        <dd className="text-muted-foreground">{account.email}</dd>
      </dl>
    </div>
  );
}
