'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { isCurrentSection } from '@/ui/current-section';

import type { Shelf } from '../core/shelf';
import { shelfPath } from '../core/shelf-path';
import { useDeleteWithUndo } from '../hooks/use-delete-with-undo';
import { useShelfList } from '../hooks/use-shelf-list';
import { ShelvesContext } from '../hooks/use-shelves';

type ShelvesProviderProps = { shelves: Shelf[]; children: ReactNode };

export function ShelvesProvider({ shelves, children }: ShelvesProviderProps) {
  const list = useShelfList(shelves);
  const withUndo = useDeleteWithUndo(list.delete);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ShelvesContext
      value={{
        shelves: list.shelves.filter(({ id }) => !withUndo.waiting.has(id)),
        create: list.create,
        update: list.update,
        move: list.move,
        delete: (shelf) => {
          withUndo.delete(shelf);
          if (isCurrentSection(pathname, shelfPath(shelf.id))) {
            router.replace('/shelves');
          }
        },
      }}
    >
      {children}
    </ShelvesContext>
  );
}
