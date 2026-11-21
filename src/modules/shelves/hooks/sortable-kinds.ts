import type { Data } from '@dnd-kit/abstract';
import type { Draggable, Droppable } from '@dnd-kit/dom';
import {
  isSortable,
  type SortableDraggable,
  type SortableDroppable,
} from '@dnd-kit/dom/sortable';

export const SHELF = 'shelf';
export const DOC = 'doc';

export function isShelf(
  source: Draggable | null,
): source is SortableDraggable<Data> {
  return isSortable(source) && source.type === SHELF;
}

export function isDoc(
  source: Draggable | null,
): source is SortableDraggable<Data> {
  return isSortable(source) && source.type === DOC;
}

export function isShelfTarget(
  target: Droppable | null,
): target is SortableDroppable<Data> {
  return isSortable(target) && target.type === SHELF;
}

export function isDocTarget(
  target: Droppable | null,
): target is SortableDroppable<Data> {
  return isSortable(target) && target.type === DOC;
}
