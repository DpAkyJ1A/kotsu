import { type ReactNode, useSyncExternalStore } from 'react';
import { mocked } from 'storybook/test';

import {
  createShelfAction,
  deleteShelfAction,
  moveShelfAction,
  updateShelfAction,
} from '../actions';
import type { Shelf } from '../core/shelf';
import { applyShelfChange, type ShelfChange } from '../core/shelf-change';
import { ShelvesProvider } from './shelves-provider';

let saved: Shelf[] = [];
const listeners = new Set<() => void>();

function save(change: ShelfChange) {
  saved = applyShelfChange(saved, change);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startShelfServer(shelves: Shelf[]) {
  saved = shelves;
  mocked(createShelfAction).mockImplementation(
    ({ id = crypto.randomUUID(), name, color = 'violet' }) => {
      const shelf = { id, name, color };
      save({ type: 'create', shelf });
      return Promise.resolve({ ok: true, data: shelf });
    },
  );
  mocked(updateShelfAction).mockImplementation(({ id, name, color }) => {
    const current = saved.find((shelf) => shelf.id === id);
    if (!current) {
      return Promise.resolve({ ok: false, error: { code: 'NOT_FOUND' } });
    }
    const updated = {
      id,
      name: name ?? current.name,
      color: color ?? current.color,
    };
    save({ type: 'update', id, patch: updated });
    return Promise.resolve({ ok: true, data: updated });
  });
  mocked(moveShelfAction).mockImplementation(({ id, after }) => {
    save({ type: 'move', id, after });
    return Promise.resolve({ ok: true, data: undefined });
  });
  mocked(deleteShelfAction).mockImplementation(({ id }) => {
    save({ type: 'delete', id });
    return Promise.resolve({ ok: true, data: undefined });
  });
}

export function ShelvesFromServer({ children }: { children: ReactNode }) {
  const shelves = useSyncExternalStore(subscribe, () => saved);
  return <ShelvesProvider shelves={shelves}>{children}</ShelvesProvider>;
}
