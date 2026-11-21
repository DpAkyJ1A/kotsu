'use client';

import { useSortable } from '@dnd-kit/react/sortable';
import { cn } from 'cn';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { IconButton } from '@/ui/icon-button';
import { FileTextIcon, GripVerticalIcon } from '@/ui/icons';

import { docPath } from '../core/doc-path';
import { type Item, ITEM_TITLE_MAX_LENGTH } from '../core/item';
import { DOC } from '../hooks/sortable-kinds';
import { useItems } from '../hooks/use-items';
import { useOpenUnlessDoubleClicked } from '../hooks/use-open-unless-double-clicked';
import { useRenaming } from '../hooks/use-renaming';
import { DocMenu } from './doc-menu';
import { NameInput } from './name-input';

const TILE_CLASS_NAME =
  'flex aspect-4/3 flex-col justify-between gap-3 rounded-xl border bg-card p-3';

type DocTileProps = { doc: Item; index: number; onLeave: () => void };

export function DocTile({ doc, index, onLeave }: DocTileProps) {
  const t = useTranslations('shelves');
  const items = useItems();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const rename = useRenaming({ link: linkRef, name: titleRef });
  const { ref, handleRef, isDragging } = useSortable({
    id: doc.id,
    index,
    type: DOC,
    accept: DOC,
    data: { name: doc.title },
  });
  const href = docPath(doc.id);
  const handleClick = useOpenUnlessDoubleClicked({
    href,
    waitOn: titleRef,
    onDoubleClick: rename.startAtClick,
  });

  return (
    <li
      ref={ref}
      data-dragging={isDragging ? '' : undefined}
      className="group/doc relative rounded-xl select-none [-webkit-touch-callout:none] data-dragging:z-10 data-dragging:shadow-lg"
    >
      {rename.editing ? (
        <div className={TILE_CLASS_NAME}>
          <DocIcon />
          <NameInput
            label={t('docs.title')}
            maxLength={ITEM_TITLE_MAX_LENGTH}
            defaultValue={doc.title}
            {...rename.editing}
            onSave={(title, ending) => {
              if (title !== doc.title) items.rename(doc.id, title);
              rename.stop(ending);
            }}
            onCancel={rename.stop}
          />
        </div>
      ) : (
        <Link
          ref={linkRef}
          href={href}
          draggable={false}
          className={cn(
            TILE_CLASS_NAME,
            'transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          )}
          onClick={handleClick}
        >
          <DocIcon />
          <span
            ref={titleRef}
            className="line-clamp-2 text-sm font-semibold wrap-break-word"
          >
            {doc.title}
          </span>
        </Link>
      )}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
        <IconButton
          ref={handleRef}
          label={t('docs.move.handle', { title: doc.title })}
          aria-roledescription={t('move.roleDescription')}
          size="sm"
          className="sr-only bg-card text-muted-foreground focus-visible:not-sr-only focus-visible:size-8"
        >
          <GripVerticalIcon />
        </IconButton>
        <DocMenu
          doc={doc}
          className="opacity-0 group-hover/doc:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
          onRename={rename.start}
          onLeave={onLeave}
        />
      </div>
    </li>
  );
}

function DocIcon() {
  return (
    <span className="grid size-8 place-items-center rounded-lg bg-blue text-blue-foreground">
      <FileTextIcon className="size-4" />
    </span>
  );
}
