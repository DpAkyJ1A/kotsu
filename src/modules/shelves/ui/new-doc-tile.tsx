'use client';

import { useTranslations } from 'next-intl';
import type { Ref } from 'react';

import { PlusIcon } from '@/ui/icons';

import { NewDoc } from './new-doc';

type NewDocTileProps = { shelfId: string; ref: Ref<HTMLButtonElement> };

export function NewDocTile({ shelfId, ref }: NewDocTileProps) {
  const t = useTranslations('shelves.docs');

  return (
    <li className="group/new">
      <NewDoc shelfId={shelfId}>
        <button
          ref={ref}
          type="button"
          className="flex aspect-4/3 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <PlusIcon className="size-6" />
          <span className="sr-only group-only/new:not-sr-only">
            {t('newDoc')}
          </span>
        </button>
      </NewDoc>
    </li>
  );
}
