'use client';

import type { Passkey } from '@better-auth/passkey';
import { useTranslations } from 'next-intl';
import { type SubmitEvent, useId, useState, useTransition } from 'react';

import { Button } from '@/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog';
import { IconButton } from '@/ui/icon-button';
import { PencilIcon } from '@/ui/icons';
import { Input } from '@/ui/input';

import { useRenamePasskey } from '../hooks/use-rename-passkey';

const NAME_MAX_LENGTH = 50;

type RenamePasskeyDialogProps = {
  passkey: Pick<Passkey, 'id' | 'name'>;
  shownName: string;
};

export function RenamePasskeyDialog({
  passkey,
  shownName,
}: RenamePasskeyDialogProps) {
  const t = useTranslations('settings');
  const nameId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const renamePasskey = useRenamePasskey();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get('name');
    if (typeof name !== 'string') return;
    startTransition(async () => {
      if (await renamePasskey(passkey.id, name.trim())) setIsOpen(false);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <IconButton
          label={t('passkeys.rename', { name: shownName })}
          size="sm"
          className="text-muted-foreground"
        >
          <PencilIcon />
        </IconButton>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{t('passkeys.renameTitle')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5">
            <label htmlFor={nameId} className="text-sm font-semibold">
              {t('name')}
            </label>
            <Input
              id={nameId}
              name="name"
              defaultValue={passkey.name ?? ''}
              required
              pattern=".*\S.*"
              maxLength={NAME_MAX_LENGTH}
              autoComplete="off"
              readOnly={isPending}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">{t('cancel')}</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
