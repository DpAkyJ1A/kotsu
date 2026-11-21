'use client';

import { DragDropProvider } from '@dnd-kit/react';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';

import {
  DRAG_SENSORS,
  spokenDragPlugins,
  UP_AND_DOWN,
} from '../hooks/drag-setup';
import { useShelfDragging } from '../hooks/use-shelf-dragging';
import { useShelves } from '../hooks/use-shelves';
import { ShelfRow } from './shelf-row';

type ShelfListProps = { children?: ReactNode };

export function ShelfList({ children }: ShelfListProps) {
  const { shelves, move } = useShelves();
  const dragging = useShelfDragging(shelves, move);
  const locale = useLocale();

  return (
    <DragDropProvider
      key={locale}
      sensors={DRAG_SENSORS}
      modifiers={UP_AND_DOWN}
      plugins={spokenDragPlugins(dragging.instructions, dragging.announcements)}
      onDragEnd={dragging.onDragEnd}
    >
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {shelves.map((shelf, index) => (
          <ShelfRow key={shelf.id} shelf={shelf} index={index} size="page" />
        ))}
        {children}
      </ul>
    </DragDropProvider>
  );
}
