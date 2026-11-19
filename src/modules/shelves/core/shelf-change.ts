import type { PaletteColor } from '@/lib/palette-colors';

import type { Shelf } from './shelf';

export type ShelfPatch = { name?: string; color?: PaletteColor };

export type ShelfChange =
  | { type: 'create'; shelf: Shelf }
  | { type: 'update'; id: string; patch: ShelfPatch }
  | { type: 'move'; id: string; after: string | undefined }
  | { type: 'delete'; id: string };

export function applyShelfChange(
  shelves: readonly Shelf[],
  change: ShelfChange,
): Shelf[] {
  switch (change.type) {
    case 'create':
      return [...shelves, change.shelf];
    case 'update':
      return shelves.map((shelf) =>
        shelf.id === change.id ? { ...shelf, ...change.patch } : shelf,
      );
    case 'move':
      return moveAfter(shelves, change.id, change.after);
    case 'delete':
      return shelves.filter((shelf) => shelf.id !== change.id);
  }
}

export function shelfBefore(
  shelves: readonly Shelf[],
  movedId: string,
  newIndex: number,
) {
  const others = shelves.filter((shelf) => shelf.id !== movedId);
  return newIndex === 0 ? undefined : others[newIndex - 1]?.id;
}

function moveAfter(
  shelves: readonly Shelf[],
  id: string,
  after: string | undefined,
) {
  const moved = shelves.find((shelf) => shelf.id === id);
  if (!moved) return [...shelves];
  const others = shelves.filter((shelf) => shelf.id !== id);
  const at = others.findIndex((shelf) => shelf.id === after) + 1;
  return others.toSpliced(at, 0, moved);
}
