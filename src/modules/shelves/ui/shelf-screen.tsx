'use client';

import { DragDropProvider } from '@dnd-kit/react';
import { useLocale, useTranslations } from 'next-intl';
import { useRef } from 'react';

import { itemsOn } from '../core/item-change';
import { DRAG_SENSORS, spokenDragPlugins } from '../hooks/drag-setup';
import { useItems } from '../hooks/use-items';
import { useTileDragging } from '../hooks/use-tile-dragging';
import { DocTile } from './doc-tile';
import { NewDocTile } from './new-doc-tile';

type ShelfScreenProps = { shelfId: string };

export function ShelfScreen({ shelfId }: ShelfScreenProps) {
  const t = useTranslations('shelves');
  const { items } = useItems();
  const docs = itemsOn(items, shelfId);
  const newDocButton = useRef<HTMLButtonElement>(null);
  const dragging = useTileDragging(shelfId, docs);
  const locale = useLocale();

  return (
    <div className="@container grid gap-4 px-6 pt-2 pb-8">
      {docs.length === 0 && (
        <div className="grid gap-1">
          <p className="font-semibold">{t('emptyShelf')}</p>
          <p className="text-sm text-muted-foreground">{t('emptyShelfHint')}</p>
        </div>
      )}
      <DragDropProvider
        key={locale}
        sensors={DRAG_SENSORS}
        plugins={spokenDragPlugins(
          dragging.instructions,
          dragging.announcements,
        )}
        onDragEnd={dragging.onDragEnd}
      >
        <ul className="grid grid-cols-2 gap-3 @lg:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5">
          <NewDocTile ref={newDocButton} shelfId={shelfId} />
          {docs.map((doc, index) => (
            <DocTile
              key={doc.id}
              doc={doc}
              index={index}
              onLeave={() => newDocButton.current?.focus()}
            />
          ))}
        </ul>
      </DragDropProvider>
    </div>
  );
}
