'use client';

import { cn } from 'cn';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { FileTextIcon } from '@/ui/icons';

import { docPath } from '../core/doc-path';
import { type Item, ITEM_TITLE_MAX_LENGTH } from '../core/item';
import { useItems } from '../hooks/use-items';
import { useOpenUnlessDoubleClicked } from '../hooks/use-open-unless-double-clicked';
import { useRenaming } from '../hooks/use-renaming';
import { DocMenu } from './doc-menu';
import { NameInput } from './name-input';

const TILE_CLASS_NAME =
  'flex aspect-4/3 flex-col justify-between gap-3 rounded-xl border bg-card p-3';

type DocTileProps = { doc: Item; onLeave: () => void };

export function DocTile({ doc, onLeave }: DocTileProps) {
  const t = useTranslations('shelves.docs');
  const items = useItems();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const rename = useRenaming({ link: linkRef, name: titleRef });
  const href = docPath(doc.id);
  const handleClick = useOpenUnlessDoubleClicked({
    href,
    waitOn: titleRef,
    onDoubleClick: rename.startAtClick,
  });

  return (
    <li className="group/doc relative">
      {rename.editing ? (
        <div className={TILE_CLASS_NAME}>
          <DocIcon />
          <NameInput
            label={t('title')}
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
          className={cn(
            TILE_CLASS_NAME,
            'transition-colors select-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
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
      <DocMenu
        doc={doc}
        className="absolute top-2.5 right-2.5 opacity-0 group-hover/doc:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
        onRename={rename.start}
        onLeave={onLeave}
      />
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
