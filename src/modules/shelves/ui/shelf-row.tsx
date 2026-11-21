'use client';

import { useDragOperation } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { cva } from 'class-variance-authority';
import { cn } from 'cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ReactNode, useRef } from 'react';

import { isCurrentSection } from '@/ui/current-section';
import { IconButton } from '@/ui/icon-button';
import { GripVerticalIcon } from '@/ui/icons';

import { type Shelf, SHELF_NAME_MAX_LENGTH } from '../core/shelf';
import { shelfPath } from '../core/shelf-path';
import { DOC, isDoc, SHELF } from '../hooks/sortable-kinds';
import { useOpenUnlessDoubleClicked } from '../hooks/use-open-unless-double-clicked';
import { useRenaming } from '../hooks/use-renaming';
import { useShelves } from '../hooks/use-shelves';
import { NameInput } from './name-input';
import { ShelfDot } from './shelf-dot';
import type { ShelfListSize } from './shelf-list-size';
import { ShelfMenu } from './shelf-menu';

const itemVariants = cva(
  'bg-inherit select-none [-webkit-touch-callout:none] data-dragging:shadow-lg',
  {
    variants: {
      size: {
        sidebar: 'rounded-md data-dragging:bg-sidebar',
        page: 'data-dragging:bg-card',
      },
    },
  },
);

const rowVariants = cva(
  'group/shelf relative flex items-center gap-1 transition-colors',
  {
    variants: {
      size: {
        sidebar:
          'rounded-md pr-1 hover:bg-sidebar-accent has-aria-[current=page]:bg-sidebar-accent has-aria-[current=page]:text-sidebar-accent-foreground data-taking-doc:bg-sidebar-accent data-taking-doc:outline-2 data-taking-doc:-outline-offset-2 data-taking-doc:outline-primary',
        page: 'h-12 pr-2 hover:bg-accent',
      },
    },
  },
);

const linkVariants = cva(
  'flex min-w-0 flex-1 items-center self-stretch rounded-md font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-[current=page]:font-semibold',
  {
    variants: {
      size: {
        sidebar:
          'gap-2.5 py-1.5 pl-2.5 group-hover/shelf:pr-17 group-has-focus-visible/shelf:pr-17 group-has-data-[state=open]/shelf:pr-17 group-has-[[data-grip]:focus-visible]/shelf:mr-9 pointer-coarse:pr-17',
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

const actionsVariants = cva('', {
  variants: {
    size: {
      sidebar:
        'absolute inset-y-0 right-1 flex items-center gap-1 opacity-0 group-hover/shelf:opacity-100 group-has-focus-visible/shelf:opacity-100 group-has-data-[state=open]/shelf:opacity-100 group-has-[input]/shelf:hidden pointer-coarse:opacity-100',
      page: 'contents',
    },
  },
});

const LIST_STAYS_WHEN_A_SHELF_OPENS: Record<ShelfListSize, boolean> = {
  sidebar: true,
  page: false,
};

type ShelfRowProps = {
  shelf: Shelf;
  index: number;
  size: ShelfListSize;
  toggle?: ReactNode;
  newDoc?: ReactNode;
  children?: ReactNode;
};

export function ShelfRow({
  shelf,
  index,
  size,
  toggle,
  newDoc,
  children,
}: ShelfRowProps) {
  const t = useTranslations('shelves');
  const shelves = useShelves();
  const pathname = usePathname();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const rename = useRenaming({ link: linkRef, name: nameRef });
  const { ref, targetRef, handleRef, isDragging, isDropTarget } = useSortable({
    id: shelf.id,
    index,
    type: SHELF,
    accept: [SHELF, DOC],
    data: { name: shelf.name },
  });
  const { source } = useDragOperation();
  const isTakingADoc = isDropTarget && isDoc(source ?? null);
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
      className={itemVariants({ size })}
    >
      <div
        ref={targetRef}
        data-taking-doc={isTakingADoc ? '' : undefined}
        className={rowVariants({ size })}
      >
        {toggle && (
          <span className="absolute inset-y-0 left-1.5 grid place-items-center">
            {toggle}
          </span>
        )}
        {rename.editing ? (
          <div className={renameVariants({ size })}>
            <DotBox color={shelf.color} isCovered={Boolean(toggle)} />
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
            <DotBox color={shelf.color} isCovered={Boolean(toggle)} />
            <span ref={nameRef} className="truncate">
              {shelf.name}
            </span>
          </Link>
        )}
        <div className={actionsVariants({ size })}>
          <IconButton
            ref={handleRef}
            label={t('move.handle', { name: shelf.name })}
            aria-roledescription={t('move.roleDescription')}
            data-grip
            size="sm"
            className="sr-only text-muted-foreground focus-visible:not-sr-only focus-visible:size-8"
          >
            <GripVerticalIcon />
          </IconButton>
          {newDoc}
          <ShelfMenu shelf={shelf} onRename={rename.start} />
        </div>
      </div>
      {children}
    </li>
  );
}

type DotBoxProps = Pick<Shelf, 'color'> & { isCovered: boolean };

function DotBox({ color, isCovered }: DotBoxProps) {
  return (
    <span
      className={cn(
        'grid size-4 shrink-0 place-items-center',
        isCovered && 'invisible',
      )}
    >
      <ShelfDot color={color} />
    </span>
  );
}
