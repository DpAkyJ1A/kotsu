import type { DragEndEvent } from '@dnd-kit/dom';
import { useTranslations } from 'next-intl';

import { idBefore } from '../core/id-before';
import type { Shelf } from '../core/shelf';
import { spokenListMoves } from './drag-setup';
import { isShelf, isShelfTarget } from './sortable-kinds';

export function useShelfDragging(
  shelves: Shelf[],
  move: (id: string, after: string | undefined) => void,
) {
  const t = useTranslations('shelves.move');

  function handleDragEnd({ operation: { source }, canceled }: DragEndEvent) {
    if (canceled || !isShelf(source)) return;
    if (source.index === source.initialIndex) return;
    const id = String(source.id);
    move(id, idBefore(shelves, id, source.index));
  }

  return {
    instructions: t('instructions'),
    announcements: spokenListMoves({
      isMoved: isShelf,
      isTarget: isShelfTarget,
      say: (moment, place) => t(moment, place),
    }),
    onDragEnd: handleDragEnd,
  };
}
