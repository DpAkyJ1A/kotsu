'use client';

import type { Shelf } from '../core/shelf';
import { useShelves } from '../hooks/use-shelves';
import { ShelfDot } from './shelf-dot';

type ShelfHeadingProps = { shelf: Shelf };

export function ShelfHeading({ shelf: saved }: ShelfHeadingProps) {
  const { shelves } = useShelves();
  const shelf = shelves.find(({ id }) => id === saved.id) ?? saved;

  return (
    <h1 className="flex min-w-0 items-center gap-2.5 text-2xl font-bold tracking-tight">
      <ShelfDot color={shelf.color} className="size-3.5 rounded-sm" />
      <span className="truncate">{shelf.name}</span>
    </h1>
  );
}
