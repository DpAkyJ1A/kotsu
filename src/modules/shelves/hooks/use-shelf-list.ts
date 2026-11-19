import { startTransition, useOptimistic } from 'react';
import { v7 as uuidv7 } from 'uuid';

import { useActionMutation } from '@/ui/use-action-mutation';

import {
  createShelfAction,
  deleteShelfAction,
  moveShelfAction,
  updateShelfAction,
} from '../actions';
import { leastUsedColor } from '../core/least-used-color';
import type { Shelf } from '../core/shelf';
import {
  applyShelfChange,
  type ShelfChange,
  type ShelfPatch,
} from '../core/shelf-change';

export function useShelfList(saved: Shelf[]) {
  const [shelves, showChange] = useOptimistic(saved, applyShelfChange);
  const createShelf = useActionMutation(createShelfAction);
  const updateShelf = useActionMutation(updateShelfAction);
  const moveShelf = useActionMutation(moveShelfAction);
  const deleteShelf = useActionMutation(deleteShelfAction);

  function change(shelfChange: ShelfChange, save: () => Promise<void>) {
    startTransition(async () => {
      showChange(shelfChange);
      await save();
    });
  }

  return {
    shelves,
    create: (name: string) => {
      const shelf: Shelf = {
        id: uuidv7(),
        name,
        color: leastUsedColor(shelves.map(({ color }) => color)),
      };
      change({ type: 'create', shelf }, () => createShelf(shelf));
    },
    update: (id: string, patch: ShelfPatch) => {
      change({ type: 'update', id, patch }, () =>
        updateShelf({ id, ...patch }),
      );
    },
    move: (id: string, after: string | undefined) => {
      change({ type: 'move', id, after }, () => moveShelf({ id, after }));
    },
    delete: (id: string) => {
      change({ type: 'delete', id }, () => deleteShelf({ id }));
    },
  };
}
