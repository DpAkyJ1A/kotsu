import type { Item } from './item';

type ItemMove = {
  type: 'move';
  id: string;
  shelfId: string;
  after: string | undefined;
};

export type ItemChange =
  | { type: 'rename'; id: string; title: string }
  | ItemMove
  | { type: 'delete'; id: string };

export function applyItemChange(
  items: readonly Item[],
  change: ItemChange,
): Item[] {
  switch (change.type) {
    case 'rename':
      return items.map((item) =>
        item.id === change.id ? { ...item, title: change.title } : item,
      );
    case 'move':
      return moveItem(items, change);
    case 'delete':
      return items.filter((item) => item.id !== change.id);
  }
}

export function itemsOn(items: readonly Item[], shelfId: string) {
  return items.filter((item) => item.shelfId === shelfId);
}

function moveItem(items: readonly Item[], { id, shelfId, after }: ItemMove) {
  const moved = items.find((item) => item.id === id);
  if (!moved) return [...items];
  const others = items.filter((item) => item.id !== id);
  return others.toSpliced(placeOn(others, shelfId, after), 0, {
    ...moved,
    shelfId,
  });
}

function placeOn(
  items: readonly Item[],
  shelfId: string,
  after: string | undefined,
) {
  if (after === undefined) return startOf(items, shelfId);
  const previous = items.findIndex(
    (item) => item.id === after && item.shelfId === shelfId,
  );
  return previous === -1 ? items.length : previous + 1;
}

function startOf(items: readonly Item[], shelfId: string) {
  const first = items.findIndex((item) => item.shelfId === shelfId);
  return first === -1 ? items.length : first;
}
