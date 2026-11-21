'use client';

import { useTranslations } from 'next-intl';
import { useId, useRef } from 'react';

import { IconButton } from '@/ui/icon-button';
import { PlusIcon } from '@/ui/icons';

import { useNewShelf } from '../hooks/use-new-shelf';
import { NewShelfRow } from './new-shelf-row';
import { ShelfTree } from './shelf-tree';

type ShelfNavProps = { collapsed: readonly string[] };

export function ShelfNav({ collapsed }: ShelfNavProps) {
  const t = useTranslations();
  const headingId = useId();
  const newShelfButton = useRef<HTMLButtonElement>(null);
  const newShelf = useNewShelf(newShelfButton);

  return (
    <nav
      aria-labelledby={headingId}
      className="flex min-h-0 flex-1 flex-col gap-1"
    >
      <div className="flex items-center justify-between pl-2.5">
        <h2
          id={headingId}
          className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
        >
          {t('nav.shelves')}
        </h2>
        <IconButton
          ref={newShelfButton}
          label={t('shelves.newShelf')}
          size="sm"
          className="text-muted-foreground"
          onClick={newShelf.start}
        >
          <PlusIcon />
        </IconButton>
      </div>
      <div className="-mx-3 min-h-0 overflow-y-auto px-3 py-0.5">
        <ShelfTree collapsed={collapsed}>
          {newShelf.isCreating && (
            <NewShelfRow size="sidebar" onDone={newShelf.stop} />
          )}
        </ShelfTree>
      </div>
    </nav>
  );
}
