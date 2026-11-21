import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/dom';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { changesPlace, moveOntoShelf, moveOverDoc } from '../core/doc-drag';
import type { Item } from '../core/item';
import { applyItemChange, type ItemMove, itemsOn } from '../core/item-change';
import { isBelow } from './drag-geometry';
import { isDoc, isDocTarget, isShelfTarget } from './sortable-kinds';
import { useItems } from './use-items';
import { useShelves } from './use-shelves';

export function useDocDragging(onLanded: (shelfId: string) => void) {
  const t = useTranslations('shelves.docs.move');
  const { shelves } = useShelves();
  const items = useItems();
  const [preview, setPreview] = useState<ItemMove | null>(null);
  const latestPreview = useRef<ItemMove | null>(null);

  function shownWith(move: ItemMove | null) {
    return move ? applyItemChange(items.items, move) : items.items;
  }

  function showPreview(move: ItemMove | null) {
    latestPreview.current = move;
    setPreview(move);
  }

  function moveOver({ operation }: DragOverEvent) {
    const { source, target } = operation;
    if (!isDocTarget(target)) return undefined;
    return moveOverDoc(shownWith(latestPreview.current), {
      id: String(source?.id),
      overId: String(target.id),
      isBelow: isBelow(operation),
    });
  }

  function moveOnto({
    operation: { source, target },
  }: DragOverEvent | DragEndEvent) {
    if (!isShelfTarget(target)) return undefined;
    return moveOntoShelf(shownWith(latestPreview.current), {
      id: String(source?.id),
      shelfId: String(target.id),
    });
  }

  function handleDragOver(event: DragOverEvent) {
    if (!isDoc(event.operation.source)) return;
    event.preventDefault();
    const move = moveOver(event);
    if (move) showPreview(move);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!isDoc(event.operation.source)) return;
    const move = moveOnto(event) ?? latestPreview.current;
    showPreview(null);
    if (event.canceled || !move || !changesPlace(items.items, move)) return;
    items.move(move.id, move.shelfId, move.after);
    onLanded(move.shelfId);
  }

  function placeIn(list: readonly Item[], id: string) {
    const doc = list.find((item) => item.id === id);
    const docs = doc ? itemsOn(list, doc.shelfId) : [];
    return {
      title: doc?.title ?? '',
      shelf: shelfName(doc?.shelfId),
      position: doc ? docs.indexOf(doc) + 1 : 0,
      count: docs.length,
    };
  }

  function shelfName(shelfId: string | undefined) {
    return shelves.find(({ id }) => id === shelfId)?.name ?? '';
  }

  function ontoShelf({
    operation: { source, target },
  }: DragOverEvent | DragEndEvent) {
    const { title } = placeIn(items.items, String(source?.id));
    return { title, shelf: shelfName(String(target?.id)) };
  }

  return {
    items: shownWith(preview),
    announcements: {
      dragstart: ({ operation: { source } }: DragStartEvent) =>
        isDoc(source)
          ? t('pickedUp', placeIn(items.items, String(source.id)))
          : undefined,
      dragover: (event: DragOverEvent) => {
        const { source, target } = event.operation;
        if (!isDoc(source) || source.id === target?.id) return undefined;
        if (moveOnto(event)) return t('overShelf', ontoShelf(event));
        const move = moveOver(event) ?? latestPreview.current;
        return t('movedTo', placeIn(shownWith(move), String(source.id)));
      },
      dragend: (event: DragEndEvent) => {
        const { source } = event.operation;
        if (!isDoc(source)) return undefined;
        const id = String(source.id);
        if (event.canceled) return t('cancelled', placeIn(items.items, id));
        if (moveOnto(event)) return t('droppedOnShelf', ontoShelf(event));
        return t('dropped', placeIn(shownWith(latestPreview.current), id));
      },
    },
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
  };
}
