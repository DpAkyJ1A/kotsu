'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useRef } from 'react';

import { Button } from '@/ui/button';
import { IconButton } from '@/ui/icon-button';
import { PlusIcon } from '@/ui/icons';
import { PageHeader } from '@/ui/page-header';

import { useNewShelf } from '../hooks/use-new-shelf';
import { useShelves } from '../hooks/use-shelves';
import { NewShelfRow } from './new-shelf-row';
import { ShelfList } from './shelf-list';

type ShelvesScreenProps = { avatar: ReactNode };

export function ShelvesScreen({ avatar }: ShelvesScreenProps) {
  const t = useTranslations();
  const { shelves } = useShelves();
  const newShelfButton = useRef<HTMLButtonElement>(null);
  const newShelf = useNewShelf(newShelfButton);
  const isEmpty = shelves.length === 0 && !newShelf.isCreating;

  return (
    <>
      <PageHeader>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('nav.shelves')}
        </h1>
        <IconButton
          ref={newShelfButton}
          label={t('shelves.newShelf')}
          className="ml-auto"
          onClick={newShelf.start}
        >
          <PlusIcon />
        </IconButton>
        {avatar}
      </PageHeader>
      <div className="px-6 pb-8 md:max-w-lg">
        {isEmpty ? (
          <div className="grid justify-items-start gap-1 py-4">
            <p className="font-semibold">{t('shelves.empty')}</p>
            <p className="text-sm text-muted-foreground">
              {t('shelves.emptyHint')}
            </p>
            <Button className="mt-3" onClick={newShelf.start}>
              <PlusIcon />
              {t('shelves.newShelf')}
            </Button>
          </div>
        ) : (
          <ShelfList>
            {newShelf.isCreating && (
              <NewShelfRow size="page" onDone={newShelf.stop} />
            )}
          </ShelfList>
        )}
      </div>
    </>
  );
}
