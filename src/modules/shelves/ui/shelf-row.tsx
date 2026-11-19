'use client';

import { useSortable } from '@dnd-kit/react/sortable';
import { cva } from 'class-variance-authority';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type MouseEvent, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { isCurrentSection } from '@/ui/current-section';
import { IconButton } from '@/ui/icon-button';
import { GripVerticalIcon } from '@/ui/icons';

import type { Shelf } from '../core/shelf';
import { shelfPath } from '../core/shelf-path';
import { useShelves } from '../hooks/use-shelves';
import { ShelfDot } from './shelf-dot';
import type { ShelfListSize } from './shelf-list-size';
import { ShelfMenu } from './shelf-menu';
import { type Ending, ShelfNameInput } from './shelf-name-input';

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

type Renaming = { caret?: number };

type ShelfRowProps = { shelf: Shelf; index: number; size: ShelfListSize };

export function ShelfRow({ shelf, index, size }: ShelfRowProps) {
  const t = useTranslations('shelves.move');
  const shelves = useShelves();
  const pathname = usePathname();
  const [renaming, setRenaming] = useState<Renaming | null>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const { ref, handleRef, isDragging } = useSortable({
    id: shelf.id,
    index,
    data: { name: shelf.name },
  });
  const href = shelfPath(shelf.id);

  function startRenaming(start: Renaming) {
    flushSync(() => {
      setRenaming(start);
    });
  }

  function stopRenaming({ restoreFocus }: Ending) {
    flushSync(() => {
      setRenaming(null);
    });
    if (restoreFocus) linkRef.current?.focus();
  }

  return (
    <li
      ref={ref}
      data-dragging={isDragging ? '' : undefined}
      className={rowVariants({ size })}
    >
      {renaming ? (
        <div className={renameVariants({ size })}>
          <DotBox color={shelf.color} />
          <ShelfNameInput
            defaultValue={shelf.name}
            {...renaming}
            onSave={(name, ending) => {
              if (name !== shelf.name) shelves.update(shelf.id, { name });
              stopRenaming(ending);
            }}
            onCancel={stopRenaming}
          />
        </div>
      ) : (
        <Link
          ref={linkRef}
          href={href}
          draggable={false}
          aria-current={isCurrentSection(pathname, href) ? 'page' : undefined}
          className={linkVariants({ size })}
          onDoubleClick={(event) => {
            startRenaming({ caret: caretIn(nameRef.current, event) });
          }}
        >
          <DotBox color={shelf.color} />
          <span ref={nameRef} className="truncate">
            {shelf.name}
          </span>
        </Link>
      )}
      <IconButton
        ref={handleRef}
        label={t('handle', { name: shelf.name })}
        aria-roledescription={t('roleDescription')}
        size="sm"
        className="sr-only text-muted-foreground focus-visible:not-sr-only focus-visible:size-8"
      >
        <GripVerticalIcon />
      </IconButton>
      <ShelfMenu
        shelf={shelf}
        className={menuVariants({ size })}
        onRename={() => {
          startRenaming({});
        }}
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

function caretIn(name: HTMLElement | null, event: MouseEvent) {
  const caret = document.caretPositionFromPoint(event.clientX, event.clientY);
  if (caret && name?.contains(caret.offsetNode)) return caret.offset;
  return name?.textContent.length ?? 0;
}
