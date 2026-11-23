'use client';

import { cn } from 'cn';
import { useTranslations } from 'next-intl';

import type { SaveStatus } from '../core/save-state';

const IS_A_PROBLEM: Record<SaveStatus, boolean> = {
  saving: false,
  saved: false,
  offline: true,
  tooLong: true,
  storageFull: true,
  notSaved: true,
};

type DocSaveStatusProps = { status: SaveStatus };

export function DocSaveStatus({ status }: DocSaveStatusProps) {
  const t = useTranslations('docs.saveStatus');

  return (
    <p
      role="status"
      className={cn(
        'ml-auto shrink-0 text-sm text-muted-foreground',
        IS_A_PROBLEM[status] && 'text-destructive',
      )}
    >
      {t(status)}
    </p>
  );
}
