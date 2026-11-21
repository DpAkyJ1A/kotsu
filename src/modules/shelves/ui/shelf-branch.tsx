'use client';

import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { useId, useRef } from 'react';

import { IconButton } from '@/ui/icon-button';
import { ChevronRightIcon, PlusIcon } from '@/ui/icons';

import type { Item } from '../core/item';
import type { Shelf } from '../core/shelf';
import { DocRow } from './doc-row';
import { NewDoc } from './new-doc';
import { ShelfDot } from './shelf-dot';
import { ShelfRow } from './shelf-row';

const DOT_UNTIL_HOVER =
  'group-hover/shelf:opacity-0 group-focus-visible/toggle:opacity-0 pointer-coarse:opacity-0';

const CHEVRON_ON_HOVER =
  'opacity-0 group-hover/shelf:opacity-100 group-focus-visible/toggle:opacity-100 pointer-coarse:opacity-100';

type ShelfBranchProps = {
  shelf: Shelf;
  index: number;
  docs: Item[];
  isOpen: boolean;
  onToggle: () => void;
  onCreated: () => void;
};

export function ShelfBranch({
  shelf,
  index,
  docs,
  isOpen,
  onToggle,
  onCreated,
}: ShelfBranchProps) {
  const t = useTranslations('shelves.docs');
  const docsId = useId();
  const newDocButton = useRef<HTMLButtonElement>(null);
  const hasDocs = docs.length > 0;

  return (
    <ShelfRow
      shelf={shelf}
      index={index}
      size="sidebar"
      toggle={
        hasDocs && (
          <IconButton
            label={t('toggle', { name: shelf.name })}
            aria-expanded={isOpen}
            aria-controls={isOpen ? docsId : undefined}
            size="sm"
            className="group/toggle size-6 text-muted-foreground"
            onClick={onToggle}
          >
            <span className="grid place-items-center *:transition *:[grid-area:1/1] motion-reduce:*:transition-none">
              <ShelfDot color={shelf.color} className={DOT_UNTIL_HOVER} />
              <ChevronRightIcon
                className={cn(
                  'size-3.5',
                  CHEVRON_ON_HOVER,
                  isOpen && 'rotate-90',
                )}
              />
            </span>
          </IconButton>
        )
      }
      newDoc={
        <NewDoc shelfId={shelf.id} side="right" onCreated={onCreated}>
          <IconButton
            ref={newDocButton}
            label={t('newDocOn', { name: shelf.name })}
            size="sm"
            className="text-muted-foreground"
          >
            <PlusIcon />
          </IconButton>
        </NewDoc>
      }
    >
      {hasDocs && isOpen && (
        <ul
          id={docsId}
          className="ml-4.5 grid grid-cols-1 gap-px border-l border-sidebar-border pl-1.5"
        >
          {docs.map((doc, docIndex) => (
            <DocRow
              key={doc.id}
              doc={doc}
              index={docIndex}
              onLeave={() => newDocButton.current?.focus()}
            />
          ))}
        </ul>
      )}
    </ShelfRow>
  );
}
