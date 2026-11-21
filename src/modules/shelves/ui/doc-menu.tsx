'use client';

import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { useId, useRef } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { IconButton } from '@/ui/icon-button';
import { EllipsisIcon, PencilIcon, Trash2Icon } from '@/ui/icons';

import type { Item } from '../core/item';
import { itemsOn } from '../core/item-change';
import { useItems } from '../hooks/use-items';
import { useShelves } from '../hooks/use-shelves';
import { ShelfDot } from './shelf-dot';

type DocMenuProps = {
  doc: Item;
  className?: string;
  onRename: () => void;
  onLeave: () => void;
};

export function DocMenu({ doc, className, onRename, onLeave }: DocMenuProps) {
  const t = useTranslations('shelves');
  const { shelves } = useShelves();
  const items = useItems();
  const closesFor = useRef<'rename' | 'leave' | null>(null);
  const moveToId = useId();

  function moveTo(shelfId: string) {
    if (shelfId === doc.shelfId) return;
    closesFor.current = 'leave';
    items.move(doc.id, shelfId, itemsOn(items.items, shelfId).at(-1)?.id);
  }

  function handleCloseAutoFocus(event: Event) {
    const reason = closesFor.current;
    closesFor.current = null;
    if (reason === null) return;
    event.preventDefault();
    if (reason === 'leave') onLeave();
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <IconButton
          label={t('docs.options', { title: doc.title })}
          size="sm"
          className={cn('text-muted-foreground', className)}
        >
          <EllipsisIcon />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 pointer-coarse:w-64"
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <DropdownMenuItem
          onSelect={() => {
            closesFor.current = 'rename';
            onRename();
          }}
        >
          <PencilIcon />
          {t('rename')}
        </DropdownMenuItem>
        <DropdownMenuLabel id={moveToId}>{t('docs.moveTo')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          aria-labelledby={moveToId}
          value={doc.shelfId}
          onValueChange={moveTo}
        >
          {shelves.map((shelf) => (
            <DropdownMenuRadioItem key={shelf.id} value={shelf.id}>
              <ShelfDot color={shelf.color} />
              <span className="min-w-0 truncate">{shelf.name}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            closesFor.current = 'leave';
            items.delete(doc);
          }}
        >
          <Trash2Icon />
          {t('delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
