'use client';

import { useSortable } from '@dnd-kit/react/sortable';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { isCurrentSection } from '@/ui/current-section';
import { IconButton } from '@/ui/icon-button';
import { FileTextIcon, GripVerticalIcon } from '@/ui/icons';

import { docPath } from '../core/doc-path';
import { type Item, ITEM_TITLE_MAX_LENGTH } from '../core/item';
import { DOC } from '../hooks/sortable-kinds';
import { useItems } from '../hooks/use-items';
import { useRenaming } from '../hooks/use-renaming';
import { DocMenu } from './doc-menu';
import { NameInput } from './name-input';

type DocRowProps = { doc: Item; index: number; onLeave: () => void };

export function DocRow({ doc, index, onLeave }: DocRowProps) {
  const t = useTranslations('shelves');
  const items = useItems();
  const pathname = usePathname();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const rename = useRenaming({ link: linkRef, name: titleRef });
  const { ref, handleRef, isDragging } = useSortable({
    id: doc.id,
    index,
    group: doc.shelfId,
    type: DOC,
    accept: DOC,
    data: { name: doc.title },
  });
  const href = docPath(doc.id);

  return (
    <li
      ref={ref}
      data-dragging={isDragging ? '' : undefined}
      className="group/doc relative flex items-center gap-1 rounded-md bg-inherit pr-1 transition-colors select-none [-webkit-touch-callout:none] hover:bg-sidebar-accent has-aria-[current=page]:bg-sidebar-accent has-aria-[current=page]:text-sidebar-accent-foreground data-dragging:bg-sidebar data-dragging:opacity-80 data-dragging:shadow-lg"
    >
      {rename.editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-1 pl-2.75">
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
          aria-current={isCurrentSection(pathname, href) ? 'page' : undefined}
          className="flex min-w-0 flex-1 items-center gap-2.5 self-stretch rounded-md py-1.5 pl-2.75 group-hover/doc:pr-8 group-has-focus-visible/doc:pr-8 group-has-data-[state=open]/doc:pr-8 group-has-[[data-grip]:focus-visible]/doc:mr-9 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-[current=page]:font-semibold pointer-coarse:pr-8"
          onDoubleClick={rename.startAtClick}
        >
          <DocIcon />
          <span ref={titleRef} className="truncate">
            {doc.title}
          </span>
        </Link>
      )}
      <div className="absolute inset-y-0 right-1 flex items-center gap-1 opacity-0 group-hover/doc:opacity-100 group-has-focus-visible/doc:opacity-100 group-has-data-[state=open]/doc:opacity-100 group-has-[input]/doc:hidden pointer-coarse:opacity-100">
        <IconButton
          ref={handleRef}
          label={t('docs.move.handle', { title: doc.title })}
          aria-roledescription={t('move.roleDescription')}
          data-grip
          size="sm"
          className="sr-only text-muted-foreground focus-visible:not-sr-only focus-visible:size-8"
        >
          <GripVerticalIcon />
        </IconButton>
        <DocMenu doc={doc} onRename={rename.start} onLeave={onLeave} />
      </div>
    </li>
  );
}

function DocIcon() {
  return (
    <span className="grid size-4 shrink-0 place-items-center rounded-xs bg-blue text-blue-foreground">
      <FileTextIcon className="size-3" />
    </span>
  );
}
