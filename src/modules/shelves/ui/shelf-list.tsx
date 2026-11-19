'use client';

import { DragDropProvider } from '@dnd-kit/react';
import { cva } from 'class-variance-authority';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';

import { useShelfDragging } from '../hooks/use-shelf-dragging';
import { useShelves } from '../hooks/use-shelves';
import type { ShelfListSize } from './shelf-list-size';
import { ShelfRow } from './shelf-row';

const listVariants = cva('', {
  variants: {
    size: {
      sidebar: 'grid gap-px',
      page: 'divide-y overflow-hidden rounded-xl border bg-card',
    },
  },
});

type ShelfListProps = { size: ShelfListSize; children?: ReactNode };

export function ShelfList({ size, children }: ShelfListProps) {
  const { shelves, move } = useShelves();
  const dragging = useShelfDragging(shelves, move);
  const locale = useLocale();

  return (
    <DragDropProvider key={locale} {...dragging}>
      <ul className={listVariants({ size })}>
        {shelves.map((shelf, index) => (
          <ShelfRow key={shelf.id} shelf={shelf} index={index} size={size} />
        ))}
        {children}
      </ul>
    </DragDropProvider>
  );
}
