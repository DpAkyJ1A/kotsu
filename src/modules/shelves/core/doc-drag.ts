import type { Item } from './item';
import { type ItemMove, itemsOn } from './item-change';

type DocOverDoc = { id: string; overId: string; isBelow: boolean };

type DocOntoShelf = { id: string; shelfId: string };

export function moveOverDoc(
  items: readonly Item[],
  { id, overId, isBelow }: DocOverDoc,
): ItemMove | undefined {
  const moved = items.find((item) => item.id === id);
  const over = items.find((item) => item.id === overId);
  if (!moved || !over || moved === over) return undefined;
  const docs = itemsOn(items, over.shelfId);
  const goesBelow = moved.shelfId !== over.shelfId && isBelow;
  const at = docs.indexOf(over) + (goesBelow ? 1 : 0);
  const others = docs.filter((doc) => doc !== moved);
  return { type: 'move', id, shelfId: over.shelfId, after: others[at - 1]?.id };
}

export function moveOntoShelf(
  items: readonly Item[],
  { id, shelfId }: DocOntoShelf,
): ItemMove | undefined {
  const moved = items.find((item) => item.id === id);
  if (!moved || moved.shelfId === shelfId) return undefined;
  return {
    type: 'move',
    id,
    shelfId,
    after: itemsOn(items, shelfId).at(-1)?.id,
  };
}

export function changesPlace(items: readonly Item[], move: ItemMove) {
  const moved = items.find((item) => item.id === move.id);
  if (!moved) return false;
  const docs = itemsOn(items, moved.shelfId);
  const before = docs[docs.indexOf(moved) - 1]?.id;
  return moved.shelfId !== move.shelfId || before !== move.after;
}
