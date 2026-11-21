import type { DragEndEvent } from '@dnd-kit/dom';
import { useTranslations } from 'next-intl';

import { idBefore } from '../core/id-before';
import type { Item } from '../core/item';
import { spokenListMoves } from './drag-setup';
import { isDoc, isDocTarget } from './sortable-kinds';
import { useItems } from './use-items';
import { useShelves } from './use-shelves';

export function useTileDragging(shelfId: string, docs: readonly Item[]) {
  const t = useTranslations('shelves.docs.move');
  const { shelves } = useShelves();
  const items = useItems();
  const shelf = shelves.find(({ id }) => id === shelfId)?.name ?? '';

  function handleDragEnd({ operation: { source }, canceled }: DragEndEvent) {
    if (canceled || !isDoc(source)) return;
    if (source.index === source.initialIndex) return;
    const id = String(source.id);
    items.move(id, shelfId, idBefore(docs, id, source.index));
  }

  return {
    instructions: t('instructions'),
    announcements: spokenListMoves({
      isMoved: isDoc,
      isTarget: isDocTarget,
      say: (moment, { name, ...place }) =>
        t(moment, { title: name, shelf, ...place }),
    }),
    onDragEnd: handleDragEnd,
  };
}
