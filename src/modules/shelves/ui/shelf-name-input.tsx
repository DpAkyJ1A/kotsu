'use client';

import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useLayoutEffect, useRef } from 'react';

import { Input } from '@/ui/input';

import { SHELF_NAME_MAX_LENGTH } from '../core/shelf';

export type Ending = { restoreFocus: boolean };

type ShelfNameInputProps = {
  defaultValue?: string;
  caret?: number;
  className?: string;
  onSave: (name: string, ending: Ending) => void;
  onCancel: (ending: Ending) => void;
};

export function ShelfNameInput({
  defaultValue = '',
  caret,
  className,
  onSave,
  onCancel,
}: ShelfNameInputProps) {
  const t = useTranslations('shelves');
  const isDone = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (caret === undefined) input.select();
    else input.setSelectionRange(caret, caret);
  }, [caret]);

  function finish(input: HTMLInputElement, ending: Ending) {
    if (isDone.current) return;
    isDone.current = true;
    const name = input.value.trim();
    if (name) onSave(name, ending);
    else onCancel(ending);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      finish(event.currentTarget, { restoreFocus: true });
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      isDone.current = true;
      onCancel({ restoreFocus: true });
    }
  }

  return (
    <Input
      ref={inputRef}
      aria-label={t('name')}
      defaultValue={defaultValue}
      maxLength={SHELF_NAME_MAX_LENGTH}
      enterKeyHint="done"
      autoComplete="off"
      className={cn('h-8 px-2', className)}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (document.hasFocus()) {
          finish(event.currentTarget, { restoreFocus: false });
        }
      }}
    />
  );
}
