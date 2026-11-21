'use client';

import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';

import { itemsOn } from '../core/item-change';
import {
  DRAG_SENSORS,
  eitherOf,
  spokenDragPlugins,
  UP_AND_DOWN,
} from '../hooks/drag-setup';
import { useCollapsedShelves } from '../hooks/use-collapsed-shelves';
import { useDocDragging } from '../hooks/use-doc-dragging';
import { useShelfDragging } from '../hooks/use-shelf-dragging';
import { useShelves } from '../hooks/use-shelves';
import { ShelfBranch } from './shelf-branch';

type ShelfTreeProps = { collapsed: readonly string[]; children?: ReactNode };

export function ShelfTree({ collapsed, children }: ShelfTreeProps) {
  const { shelves, move } = useShelves();
  const branches = useCollapsedShelves(collapsed);
  const shelfDragging = useShelfDragging(shelves, move);
  const docDragging = useDocDragging(branches.open);
  const locale = useLocale();

  function handleDragEnd(event: DragEndEvent) {
    shelfDragging.onDragEnd(event);
    docDragging.onDragEnd(event);
  }

  return (
    <DragDropProvider
      key={locale}
      sensors={DRAG_SENSORS}
      modifiers={UP_AND_DOWN}
      plugins={spokenDragPlugins(
        shelfDragging.instructions,
        eitherOf(shelfDragging.announcements, docDragging.announcements),
      )}
      onDragOver={docDragging.onDragOver}
      onDragEnd={handleDragEnd}
    >
      <ul className="grid grid-cols-1 gap-px">
        {shelves.map((shelf, index) => (
          <ShelfBranch
            key={shelf.id}
            shelf={shelf}
            index={index}
            docs={itemsOn(docDragging.items, shelf.id)}
            isOpen={branches.isOpen(shelf.id)}
            onToggle={() => {
              branches.toggle(shelf.id);
            }}
            onCreated={() => {
              branches.open(shelf.id);
            }}
          />
        ))}
        {children}
      </ul>
    </DragDropProvider>
  );
}
