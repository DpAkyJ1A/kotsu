'use client';

import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';

import { PALETTE_COLORS } from '@/lib/palette-colors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSwatchGroup,
  DropdownMenuSwatchItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { IconButton } from '@/ui/icon-button';
import { EllipsisIcon, PencilIcon, Trash2Icon } from '@/ui/icons';

import { itemsOn } from '../core/item-change';
import type { Shelf } from '../core/shelf';
import { useItems } from '../hooks/use-items';
import { useShelves } from '../hooks/use-shelves';
import { DeleteShelfDialog } from './delete-shelf-dialog';
import { PALETTE_FILL } from './palette-fill';

type ShelfMenuProps = {
  shelf: Shelf;
  onRename: () => void;
};

export function ShelfMenu({ shelf, onRename }: ShelfMenuProps) {
  const t = useTranslations('shelves');
  const shelves = useShelves();
  const { existing } = useItems();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const movesFocus = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const colourId = useId();
  const docs = itemsOn(existing, shelf.id);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <IconButton
            ref={trigger}
            label={t('options', { name: shelf.name })}
            size="sm"
            className="text-muted-foreground"
          >
            <EllipsisIcon />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-60 pointer-coarse:w-72"
          onCloseAutoFocus={(event) => {
            if (!movesFocus.current) return;
            movesFocus.current = false;
            event.preventDefault();
          }}
        >
          <DropdownMenuItem
            onSelect={() => {
              movesFocus.current = true;
              onRename();
            }}
          >
            <PencilIcon />
            {t('rename')}
          </DropdownMenuItem>
          <DropdownMenuLabel id={colourId}>{t('colour')}</DropdownMenuLabel>
          <DropdownMenuSwatchGroup
            aria-labelledby={colourId}
            value={shelf.color}
          >
            {PALETTE_COLORS.map((color) => (
              <DropdownMenuSwatchItem
                key={color}
                value={color}
                aria-label={t(`colours.${color}`)}
                textValue={t(`colours.${color}`)}
                className={PALETTE_FILL[color]}
                onSelect={() => {
                  shelves.update(shelf.id, { color });
                }}
              />
            ))}
          </DropdownMenuSwatchGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              if (docs.length === 0) {
                shelves.delete(shelf);
                return;
              }
              movesFocus.current = true;
              setIsConfirmingDelete(true);
            }}
          >
            <Trash2Icon />
            {t('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteShelfDialog
        shelf={shelf}
        docs={docs}
        isOpen={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus();
        }}
        onDelete={() => {
          shelves.delete(shelf);
        }}
      />
    </>
  );
}
