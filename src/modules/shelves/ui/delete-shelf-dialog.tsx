'use client';

import { useTranslations } from 'next-intl';
import { type SubmitEvent, useId, useState } from 'react';

import { Button } from '@/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import { FileTextIcon } from '@/ui/icons';
import { Input } from '@/ui/input';

import type { Item } from '../core/item';
import type { Shelf } from '../core/shelf';

type DeleteShelfDialogProps = {
  shelf: Shelf;
  docs: Item[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCloseAutoFocus: (event: Event) => void;
  onDelete: () => void;
};

export function DeleteShelfDialog({
  shelf,
  docs,
  isOpen,
  onOpenChange,
  onCloseAutoFocus,
  onDelete,
}: DeleteShelfDialogProps) {
  const t = useTranslations('shelves.deleteShelf');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>{t('title', { name: shelf.name })}</DialogTitle>
          <DialogDescription>
            {t('docs', { count: docs.length })}
          </DialogDescription>
        </DialogHeader>
        <ul className="-mt-2 flex flex-col gap-1.5 text-sm">
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center gap-2">
              <FileTextIcon className="shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate">{doc.title}</span>
            </li>
          ))}
        </ul>
        <ConfirmByName name={shelf.name} onConfirm={onDelete} />
      </DialogContent>
    </Dialog>
  );
}

type ConfirmByNameProps = { name: string; onConfirm: () => void };

function ConfirmByName({ name, onConfirm }: ConfirmByNameProps) {
  const t = useTranslations('shelves.deleteShelf');
  const fieldId = useId();
  const [typed, setTyped] = useState('');
  const isTyped = typed.trim() === name;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onConfirm();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-1.5">
        <label htmlFor={fieldId} className="text-sm">
          {t.rich('typeName', {
            name,
            strong: (chunks) => (
              <strong className="font-semibold">{chunks}</strong>
            ),
          })}
        </label>
        <Input
          id={fieldId}
          value={typed}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => {
            setTyped(event.target.value);
          }}
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost">{t('cancel')}</Button>
        </DialogClose>
        <Button type="submit" variant="destructive" disabled={!isTyped}>
          {t('confirm')}
        </Button>
      </DialogFooter>
    </form>
  );
}
