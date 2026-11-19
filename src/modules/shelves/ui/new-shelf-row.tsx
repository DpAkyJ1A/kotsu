'use client';

import { cva } from 'class-variance-authority';

import { useShelves } from '../hooks/use-shelves';
import type { ShelfListSize } from './shelf-list-size';
import { type Ending, ShelfNameInput } from './shelf-name-input';

const rowVariants = cva('flex items-center', {
  variants: {
    size: {
      sidebar: 'px-1 py-0.5',
      page: 'h-12 px-2',
    },
  },
});

type NewShelfRowProps = {
  size: ShelfListSize;
  onDone: (ending: Ending) => void;
};

export function NewShelfRow({ size, onDone }: NewShelfRowProps) {
  const shelves = useShelves();

  return (
    <li className={rowVariants({ size })}>
      <ShelfNameInput
        onSave={(name, ending) => {
          shelves.create(name);
          onDone(ending);
        }}
        onCancel={onDone}
      />
    </li>
  );
}
