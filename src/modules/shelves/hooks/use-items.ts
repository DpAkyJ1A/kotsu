import { createContext, use } from 'react';

import type { Item } from '../core/item';

type Items = {
  items: Item[];
  existing: Item[];
  createDoc: (shelfId: string, title: string) => Promise<boolean>;
  rename: (id: string, title: string) => void;
  move: (id: string, shelfId: string, after: string | undefined) => void;
  delete: (item: Item) => void;
};

export const ItemsContext = createContext<Items | null>(null);

export function useItems() {
  const items = use(ItemsContext);
  if (!items) throw new Error('Item parts need a ShelvesProvider above');
  return items;
}
