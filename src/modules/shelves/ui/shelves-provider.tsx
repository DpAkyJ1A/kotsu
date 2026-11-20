'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { isCurrentSection } from '@/ui/current-section';

import { docPath } from '../core/doc-path';
import type { Item } from '../core/item';
import { itemsOn } from '../core/item-change';
import type { Shelf } from '../core/shelf';
import { shelfPath } from '../core/shelf-path';
import { useDeleteWithUndo } from '../hooks/use-delete-with-undo';
import { useItemList } from '../hooks/use-item-list';
import { ItemsContext } from '../hooks/use-items';
import { useShelfList } from '../hooks/use-shelf-list';
import { ShelvesContext } from '../hooks/use-shelves';

type ShelvesProviderProps = {
  shelves: Shelf[];
  items: Item[];
  children: ReactNode;
};

export function ShelvesProvider({
  shelves,
  items,
  children,
}: ShelvesProviderProps) {
  const t = useTranslations('shelves');
  const shelfList = useShelfList(shelves);
  const itemList = useItemList(items);
  const shelvesWithUndo = useDeleteWithUndo(shelfList.delete);
  const itemsWithUndo = useDeleteWithUndo(itemList.delete);
  const pathname = usePathname();
  const router = useRouter();

  function leaveIfShown(shelf: Shelf) {
    const pages = [
      shelfPath(shelf.id),
      ...itemsOn(itemList.items, shelf.id).map(({ id }) => docPath(id)),
    ];
    if (pages.some((page) => isCurrentSection(pathname, page))) {
      router.replace('/shelves');
    }
  }

  return (
    <ShelvesContext
      value={{
        shelves: shelfList.shelves.filter(
          ({ id }) => !shelvesWithUndo.waiting.has(id),
        ),
        create: shelfList.create,
        update: shelfList.update,
        move: shelfList.move,
        delete: (shelf) => {
          shelvesWithUndo.delete(shelf.id, t('deleted', { name: shelf.name }));
          leaveIfShown(shelf);
        },
      }}
    >
      <ItemsContext
        value={{
          items: itemList.items.filter(
            ({ id }) => !itemsWithUndo.waiting.has(id),
          ),
          existing: itemList.items,
          createDoc: itemList.createDoc,
          rename: itemList.rename,
          move: itemList.move,
          delete: (item) => {
            itemsWithUndo.delete(
              item.id,
              t('docs.deleted', { title: item.title }),
            );
          },
        }}
      >
        {children}
      </ItemsContext>
    </ShelvesContext>
  );
}
