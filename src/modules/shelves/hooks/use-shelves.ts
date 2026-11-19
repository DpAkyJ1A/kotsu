import { createContext, use } from 'react';

import type { Shelf } from '../core/shelf';
import type { ShelfPatch } from '../core/shelf-change';

type Shelves = {
  shelves: Shelf[];
  create: (name: string) => void;
  update: (id: string, patch: ShelfPatch) => void;
  move: (id: string, after: string | undefined) => void;
  delete: (shelf: Shelf) => void;
};

export const ShelvesContext = createContext<Shelves | null>(null);

export function useShelves() {
  const shelves = use(ShelvesContext);
  if (!shelves) throw new Error('Shelf parts need a ShelvesProvider above');
  return shelves;
}
