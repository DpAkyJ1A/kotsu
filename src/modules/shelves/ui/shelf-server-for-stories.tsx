import { type ReactNode, useSyncExternalStore } from 'react';
import { mocked } from 'storybook/test';

import {
  createItemAction,
  createShelfAction,
  deleteItemAction,
  deleteShelfAction,
  moveItemAction,
  moveShelfAction,
  renameItemAction,
  updateShelfAction,
} from '../actions';
import type { Item } from '../core/item';
import { applyItemChange, type ItemChange } from '../core/item-change';
import type { Shelf } from '../core/shelf';
import { applyShelfChange, type ShelfChange } from '../core/shelf-change';
import { ShelvesProvider } from './shelves-provider';

type Saved = { shelves: Shelf[]; items: Item[] };

let saved: Saved = { shelves: [], items: [] };
const listeners = new Set<() => void>();

function save(next: Saved) {
  saved = next;
  for (const listener of listeners) listener();
}

function saveShelf(change: ShelfChange) {
  save({ ...saved, shelves: applyShelfChange(saved.shelves, change) });
}

function saveItem(change: ItemChange) {
  save({ ...saved, items: applyItemChange(saved.items, change) });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const NOT_FOUND = { ok: false, error: { code: 'NOT_FOUND' } } as const;

export function startShelfServer({ shelves, items }: Saved) {
  saved = { shelves, items };
  mocked(createShelfAction).mockImplementation(
    ({ id = crypto.randomUUID(), name, color = 'violet' }) => {
      const shelf = { id, name, color };
      saveShelf({ type: 'create', shelf });
      return Promise.resolve({ ok: true, data: shelf });
    },
  );
  mocked(updateShelfAction).mockImplementation(({ id, name, color }) => {
    const current = saved.shelves.find((shelf) => shelf.id === id);
    if (!current) return Promise.resolve(NOT_FOUND);
    const updated = {
      id,
      name: name ?? current.name,
      color: color ?? current.color,
    };
    saveShelf({ type: 'update', id, patch: updated });
    return Promise.resolve({ ok: true, data: updated });
  });
  mocked(moveShelfAction).mockImplementation(({ id, after }) => {
    saveShelf({ type: 'move', id, after });
    return Promise.resolve({ ok: true, data: undefined });
  });
  mocked(deleteShelfAction).mockImplementation(({ id }) => {
    save({
      shelves: applyShelfChange(saved.shelves, { type: 'delete', id }),
      items: saved.items.filter((item) => item.shelfId !== id),
    });
    return Promise.resolve({ ok: true, data: undefined });
  });
  mocked(createItemAction).mockImplementation(
    ({ id = crypto.randomUUID(), shelfId, kind, title }) => {
      const item = { id, shelfId, kind, title };
      save({ ...saved, items: [...saved.items, item] });
      return Promise.resolve({ ok: true, data: item });
    },
  );
  mocked(renameItemAction).mockImplementation(({ id, title }) => {
    const current = saved.items.find((item) => item.id === id);
    if (!current) return Promise.resolve(NOT_FOUND);
    saveItem({ type: 'rename', id, title });
    return Promise.resolve({ ok: true, data: { ...current, title } });
  });
  mocked(moveItemAction).mockImplementation(({ id, shelfId, after }) => {
    saveItem({ type: 'move', id, shelfId, after });
    return Promise.resolve({ ok: true, data: undefined });
  });
  mocked(deleteItemAction).mockImplementation(({ id }) => {
    saveItem({ type: 'delete', id });
    return Promise.resolve({ ok: true, data: undefined });
  });
}

export function ShelvesFromServer({ children }: { children: ReactNode }) {
  const { shelves, items } = useSyncExternalStore(subscribe, () => saved);
  return (
    <ShelvesProvider shelves={shelves} items={items}>
      {children}
    </ShelvesProvider>
  );
}
