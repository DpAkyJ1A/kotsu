'use client';

import type { Passkey } from '@better-auth/passkey';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button } from '@/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog';
import { IconButton } from '@/ui/icon-button';
import { Trash2Icon } from '@/ui/icons';

import { canSignalRemovedPasskey } from '../hooks/signal-removed-passkey';
import { useRemovePasskey } from '../hooks/use-remove-passkey';

type RemovePasskeyDialogProps = {
  passkey: Pick<Passkey, 'id' | 'credentialID'>;
  shownName: string;
};

export function RemovePasskeyDialog({
  passkey,
  shownName,
}: RemovePasskeyDialogProps) {
  const t = useTranslations('settings');
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const removePasskey = useRemovePasskey();

  function handleRemove() {
    startTransition(async () => {
      if (await removePasskey(passkey)) setIsOpen(false);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <IconButton
          label={t('passkeys.remove', { name: shownName })}
          size="sm"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon />
        </IconButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('passkeys.removeTitle', { name: shownName })}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="grid gap-2">
              <p>{t('passkeys.removeDescription')}</p>
              {!canSignalRemovedPasskey() && (
                <p>{t('passkeys.removeFromPasswordManager')}</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">{t('cancel')}</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isPending}
          >
            {t('passkeys.removeConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
