'use client';

import { cva } from 'class-variance-authority';
import { useTranslations } from 'next-intl';

import { SHELF_NAME_MAX_LENGTH } from '../core/shelf';
import { useShelves } from '../hooks/use-shelves';
import { type Ending, NameInput } from './name-input';
import type { ShelfListSize } from './shelf-list-size';

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
  const t = useTranslations('shelves');
  const shelves = useShelves();

  return (
    <li className={rowVariants({ size })}>
      <NameInput
        label={t('name')}
        maxLength={SHELF_NAME_MAX_LENGTH}
        onSave={(name, ending) => {
          shelves.create(name);
          onDone(ending);
        }}
        onCancel={onDone}
      />
    </li>
  );
}
