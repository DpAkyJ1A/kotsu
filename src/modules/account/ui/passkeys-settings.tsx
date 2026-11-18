'use client';

import type { Passkey } from '@better-auth/passkey';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/ui/button';
import { FingerprintPatternIcon } from '@/ui/icons';

import { AddPasskey } from './add-passkey';
import { RemovePasskeyDialog } from './remove-passkey-dialog';
import { RenamePasskeyDialog } from './rename-passkey-dialog';
import { SyncedHint } from './synced-hint';

type PasskeysSettingsProps = { email: string };

export function PasskeysSettings({ email }: PasskeysSettingsProps) {
  const t = useTranslations('settings.passkeys');
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="grid gap-3">
      <h3 id={headingId} className="text-sm font-semibold">
        {t('title')}
      </h3>
      <PasskeyList />
      <AddPasskey email={email} />
    </section>
  );
}

function PasskeyList() {
  const t = useTranslations('settings.passkeys');
  const { data: passkeys, error, refetch } = authClient.useListPasskeys();

  if (passkeys?.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('empty')}</p>;
  }
  if (passkeys) {
    return (
      <ul className="divide-y rounded-xl border">
        {passkeys.toSorted(oldestFirst).map((passkey) => (
          <PasskeyRow key={passkey.id} passkey={passkey} />
        ))}
      </ul>
    );
  }
  if (error) {
    return (
      <div role="alert" className="flex items-center gap-3 text-sm">
        <span className="text-destructive">{t('loadFailed')}</span>
        <Button variant="ghost" size="sm" onClick={() => void refetch()}>
          {t('tryAgain')}
        </Button>
      </div>
    );
  }
  return (
    <div
      role="status"
      className="h-15 animate-pulse rounded-xl bg-muted motion-reduce:animate-none"
    >
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}

function oldestFirst(a: Passkey, b: Passkey) {
  return a.createdAt.getTime() - b.createdAt.getTime();
}

type PasskeyRowProps = { passkey: Passkey };

function PasskeyRow({ passkey }: PasskeyRowProps) {
  const t = useTranslations('settings.passkeys');
  const shownName = passkey.name ?? t('unnamed');

  return (
    <li className="flex items-center gap-3 py-3 pr-2 pl-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground [&>svg]:size-4.5">
        <FingerprintPatternIcon />
      </span>
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-sm font-semibold">{shownName}</span>
        <span className="text-xs text-muted-foreground">
          {passkey.backedUp
            ? t.rich('addedSynced', {
                date: passkey.createdAt,
                synced: (word) => (
                  <span className="whitespace-nowrap">
                    {word}
                    <SyncedHint />
                  </span>
                ),
              })
            : t('added', { date: passkey.createdAt })}
        </span>
      </span>
      <div className="flex shrink-0 gap-1">
        <RenamePasskeyDialog passkey={passkey} shownName={shownName} />
        <RemovePasskeyDialog passkey={passkey} shownName={shownName} />
      </div>
    </li>
  );
}
