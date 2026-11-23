'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';

type ConflictDialogProps = {
  isOpen: boolean;
  onReload: () => void;
  onKeepMine: () => void;
  onDecideLater: () => void;
};

export function ConflictDialog({
  isOpen,
  onReload,
  onKeepMine,
  onDecideLater,
}: ConflictDialogProps) {
  const t = useTranslations('docs.conflict');
  const content = useRef<HTMLDivElement>(null);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isStillOpen) => {
        if (!isStillOpen) onDecideLater();
      }}
    >
      <DialogContent
        ref={content}
        role="alertdialog"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          content.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onReload}>
            {t('reload')}
          </Button>
          <Button onClick={onKeepMine}>{t('keepMine')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
