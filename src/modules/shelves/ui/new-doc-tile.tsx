'use client';

import { useTranslations } from 'next-intl';
import {
  type Ref,
  type SubmitEvent,
  useId,
  useRef,
  useState,
  useTransition,
} from 'react';

import { Button } from '@/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/ui/drawer';
import { PlusIcon } from '@/ui/icons';
import { Input } from '@/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { useMediaQuery } from '@/ui/use-media-query';

import { ITEM_TITLE_MAX_LENGTH } from '../core/item';
import { useItems } from '../hooks/use-items';

const WIDE_SCREEN = '(min-width: 48rem)';

type NewDocTileProps = { shelfId: string; ref: Ref<HTMLButtonElement> };

export function NewDocTile({ shelfId, ref }: NewDocTileProps) {
  const t = useTranslations('shelves.docs');
  const items = useItems();
  const isWide = useMediaQuery(WIDE_SCREEN);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isCreating, startCreating] = useTransition();
  const titleField = useRef<HTMLInputElement>(null);
  const headingId = useId();

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) setTitle('');
  }

  function focusTitle(event: Event) {
    event.preventDefault();
    titleField.current?.focus({ preventScroll: true });
  }

  function create() {
    startCreating(async () => {
      if (await items.createDoc(shelfId, title.trim())) handleOpenChange(false);
    });
  }

  const tile = (
    <button
      ref={ref}
      type="button"
      className="flex aspect-4/3 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <PlusIcon className="size-6" />
      <span className="sr-only group-only/new:not-sr-only">{t('newDoc')}</span>
    </button>
  );

  const form = (
    <NewDocForm
      titleRef={titleField}
      title={title}
      isCreating={isCreating}
      onTitleChange={setTitle}
      onCreate={create}
    />
  );

  return (
    <li className="group/new">
      {isWide ? (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>{tile}</PopoverTrigger>
          <PopoverContent
            align="start"
            aria-labelledby={headingId}
            className="grid gap-3"
            onOpenAutoFocus={focusTitle}
          >
            <h2 id={headingId} className="font-semibold">
              {t('newDoc')}
            </h2>
            {form}
          </PopoverContent>
        </Popover>
      ) : (
        <Drawer open={isOpen} onOpenChange={handleOpenChange}>
          <DrawerTrigger asChild>{tile}</DrawerTrigger>
          <DrawerContent
            aria-describedby={undefined}
            onOpenAutoFocus={focusTitle}
          >
            <DrawerHeader>
              <DrawerTitle>{t('newDoc')}</DrawerTitle>
            </DrawerHeader>
            {form}
          </DrawerContent>
        </Drawer>
      )}
    </li>
  );
}

type NewDocFormProps = {
  titleRef: Ref<HTMLInputElement>;
  title: string;
  isCreating: boolean;
  onTitleChange: (title: string) => void;
  onCreate: () => void;
};

function NewDocForm({
  titleRef,
  title,
  isCreating,
  onTitleChange,
  onCreate,
}: NewDocFormProps) {
  const t = useTranslations('shelves.docs');

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        ref={titleRef}
        value={title}
        onChange={(event) => {
          onTitleChange(event.target.value);
        }}
        aria-label={t('title')}
        placeholder={t('title')}
        required
        pattern=".*\S.*"
        maxLength={ITEM_TITLE_MAX_LENGTH}
        autoComplete="off"
        enterKeyHint="go"
        readOnly={isCreating}
      />
      <Button type="submit" disabled={isCreating}>
        {t('create')}
      </Button>
    </form>
  );
}
