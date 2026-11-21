import { useRouter } from 'next/navigation';
import { startTransition, useOptimistic } from 'react';
import { v7 as uuidv7 } from 'uuid';

import { useActionMutation } from '@/ui/use-action-mutation';

import {
  createItemAction,
  deleteItemAction,
  moveItemAction,
  renameItemAction,
} from '../actions';
import { docPath } from '../core/doc-path';
import type { Item } from '../core/item';
import { applyItemChange, type ItemChange } from '../core/item-change';

export function useItemList(saved: Item[]) {
  const [items, showChange] = useOptimistic(saved, applyItemChange);
  const router = useRouter();
  const createItem = useActionMutation(createItemAction);
  const renameItem = useActionMutation(renameItemAction);
  const moveItem = useActionMutation(moveItemAction);
  const deleteItem = useActionMutation(deleteItemAction);

  function change(itemChange: ItemChange, save: () => Promise<unknown>) {
    startTransition(async () => {
      showChange(itemChange);
      await save();
    });
  }

  return {
    items,
    createDoc: async (shelfId: string, title: string) => {
      const id = uuidv7();
      const isCreated = await createItem({ id, shelfId, kind: 'doc', title });
      if (isCreated) router.push(docPath(id));
      return isCreated;
    },
    rename: (id: string, title: string) => {
      change({ type: 'rename', id, title }, () => renameItem({ id, title }));
    },
    move: (id: string, shelfId: string, after: string | undefined) => {
      change({ type: 'move', id, shelfId, after }, () =>
        moveItem({ id, shelfId, after }),
      );
    },
    delete: (id: string) => {
      change({ type: 'delete', id }, () => deleteItem({ id }));
    },
  };
}
