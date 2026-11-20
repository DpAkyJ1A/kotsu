'use client';

import { useSortable } from '@dnd-kit/react/sortable';
import { cva } from 'class-variance-authority';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { isCurrentSection } from '@/ui/current-section';
import { IconButton } from '@/ui/icon-button';
import { GripVerticalIcon } from '@/ui/icons';

import { type Shelf, SHELF_NAME_MAX_LENGTH } from '../core/shelf';
import { shelfPath } from '../core/shelf-path';
import { useOpenUnlessDoubleClicked } from '../hooks/use-open-unless-double-clicked';
import { useRenaming } from '../hooks/use-renaming';
import { useShelves } from '../hooks/use-shelves';
import { NameInput } from './name-input';
import { ShelfDot } from './shelf-dot';
import type { ShelfListSize } from './shelf-list-size';
import { ShelfMenu } from './shelf-menu';

const rowVariants = cva(
  'group/shelf flex items-center gap-1 bg-inherit transition-colors select-none [-webkit-touch-callout:none] data-dragging:shadow-lg',
  {
    variants: {
      size: {
        sidebar:
          'rounded-md pr-1 hover:bg-sidebar-accent has-aria-[current=page]:bg-sidebar-accent has-aria-[current=page]:text-sidebar-accent-foreground data-dragging:bg-sidebar',
        page: 'h-12 pr-2 hover:bg-accent data-dragging:bg-card',
      },
    },
  },
);

const linkVariants = cva(
  'flex min-w-0 flex-1 items-center self-stretch rounded-md font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-[current=page]:font-semibold',
  {
    variants: {
      size: {
        sidebar: 'gap-2.5 py-1.5 pl-2.5',
        page: 'gap-3 pl-4 text-sm',
      },
    },
  },
);

const renameVariants = cva('flex min-w-0 flex-1 items-center', {
  variants: {
    size: {
      sidebar: 'gap-1 pl-2.5',
      page: 'gap-2 pl-4',
    },
  },
});

const menuVariants = cva('', {
  variants: {
    size: {
      sidebar:
        'opacity-0 group-hover/shelf:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100',
      page: '',
    },
  },
});

const LIST_STAYS_WHEN_A_SHELF_OPENS: Record<ShelfListSize, boolean> = {
  sidebar: true,
  page: false,
};

type ShelfRowProps = { shelf: Shelf; index: number; size: ShelfListSize };

export function ShelfRow({ shelf, index, size }: ShelfRowProps) {
  const t = useTranslations('shelves');
  const shelves = useShelves();
  const pathname = usePathname();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const rename = useRenaming({ link: linkRef, name: nameRef });
  const { ref, handleRef, isDragging } = useSortable({
    id: shelf.id,
    index,
    data: { name: shelf.name },
  });
  const href = shelfPath(shelf.id);
  const handleClick = useOpenUnlessDoubleClicked({
    href,
    waitOn: nameRef,
    onDoubleClick: rename.startAtClick,
  });
  const clickHandlers = LIST_STAYS_WHEN_A_SHELF_OPENS[size]
    ? { onDoubleClick: rename.startAtClick }
    : { onClick: handleClick };

  return (
    <li
      ref={ref}
      data-dragging={isDragging ? '' : undefined}
      className={rowVariants({ size })}
    >
      {rename.editing ? (
        <div className={renameVariants({ size })}>
          <DotBox color={shelf.color} />
          <NameInput
            label={t('name')}
            maxLength={SHELF_NAME_MAX_LENGTH}
            defaultValue={shelf.name}
            {...rename.editing}
            onSave={(name, ending) => {
              if (name !== shelf.name) shelves.update(shelf.id, { name });
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
          className={linkVariants({ size })}
          {...clickHandlers}
        >
          <DotBox color={shelf.color} />
          <span ref={nameRef} className="truncate">
            {shelf.name}
          </span>
        </Link>
      )}
      <IconButton
        ref={handleRef}
        label={t('move.handle', { name: shelf.name })}
        aria-roledescription={t('move.roleDescription')}
        size="sm"
        className="sr-only text-muted-foreground focus-visible:not-sr-only focus-visible:size-8"
      >
        <GripVerticalIcon />
      </IconButton>
      <ShelfMenu
        shelf={shelf}
        className={menuVariants({ size })}
        onRename={rename.start}
      />
    </li>
  );
}

function DotBox({ color }: Pick<Shelf, 'color'>) {
  return (
    <span className="grid size-4 shrink-0 place-items-center">
      <ShelfDot color={color} />
    </span>
  );
}
