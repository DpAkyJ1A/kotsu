'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { ChevronLeftIcon, ChevronRightIcon } from '@/ui/icons';

import type { Item } from '../core/item';
import type { Shelf } from '../core/shelf';
import { shelfPath } from '../core/shelf-path';
import { useItems } from '../hooks/use-items';
import { useShelves } from '../hooks/use-shelves';

type DocBreadcrumbProps = { doc: Item; shelf: Shelf };

export function DocBreadcrumb({
  doc: savedDoc,
  shelf: savedShelf,
}: DocBreadcrumbProps) {
  const t = useTranslations('shelves.docs');
  const { existing } = useItems();
  const { shelves } = useShelves();
  const doc = existing.find(({ id }) => id === savedDoc.id) ?? savedDoc;
  const shelf = shelves.find(({ id }) => id === doc.shelfId) ?? savedShelf;

  return (
    <>
      <Link
        href={shelfPath(shelf.id)}
        aria-label={t('backToShelf', { name: shelf.name })}
        className="-ml-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden [&>svg]:size-6"
      >
        <ChevronLeftIcon />
      </Link>
      <nav aria-label={t('breadcrumb')} className="min-w-0 max-md:hidden">
        <ol className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          <li className="min-w-0">
            <Link
              href={shelfPath(shelf.id)}
              className="block max-w-60 truncate rounded-xs transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {shelf.name}
            </Link>
          </li>
          <li aria-hidden className="shrink-0">
            <ChevronRightIcon
              className="size-3.5 text-muted-foreground/60"
              strokeWidth={1.5}
            />
          </li>
          <li aria-current="page" className="min-w-0 truncate text-foreground">
            {doc.title}
          </li>
        </ol>
      </nav>
    </>
  );
}
