'use client';

import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { useId, useRef } from 'react';

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

import type { Shelf } from '../core/shelf';
import { useShelves } from '../hooks/use-shelves';
import { PALETTE_FILL } from './palette-fill';

type ShelfMenuProps = {
  shelf: Shelf;
  className?: string;
  onRename: () => void;
};

export function ShelfMenu({ shelf, className, onRename }: ShelfMenuProps) {
  const t = useTranslations('shelves');
  const shelves = useShelves();
  const isRenaming = useRef(false);
  const colourId = useId();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <IconButton
          label={t('options', { name: shelf.name })}
          size="sm"
          className={cn('text-muted-foreground', className)}
        >
          <EllipsisIcon />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-60 pointer-coarse:w-72"
        onCloseAutoFocus={(event) => {
          if (!isRenaming.current) return;
          isRenaming.current = false;
          event.preventDefault();
        }}
      >
        <DropdownMenuItem
          onSelect={() => {
            isRenaming.current = true;
            onRename();
          }}
        >
          <PencilIcon />
          {t('rename')}
        </DropdownMenuItem>
        <DropdownMenuLabel id={colourId}>{t('colour')}</DropdownMenuLabel>
        <DropdownMenuSwatchGroup aria-labelledby={colourId} value={shelf.color}>
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
            shelves.delete(shelf);
          }}
        >
          <Trash2Icon />
          {t('delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
