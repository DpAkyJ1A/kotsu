'use client';

import { useTranslations } from 'next-intl';
import {
  type ComponentProps,
  type ReactElement,
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
import { Input } from '@/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { useMediaQuery, WIDE_SCREEN } from '@/ui/use-media-query';

import { ITEM_TITLE_MAX_LENGTH } from '../core/item';
import { useItems } from '../hooks/use-items';

type NewDocProps = {
  shelfId: string;
  side?: ComponentProps<typeof PopoverContent>['side'];
  onCreated?: () => void;
  children: ReactElement;
};

export function NewDoc({ shelfId, side, onCreated, children }: NewDocProps) {
  const t = useTranslations('shelves.docs');
  const items = useItems();
  const isWide = useMediaQuery(WIDE_SCREEN);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isCreating, startCreating] = useTransition();
  const titleField = useRef<HTMLInputElement>(null);
  const hasCreated = useRef(false);
  const headingId = useId();

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (open) hasCreated.current = false;
    else setTitle('');
  }

  function focusTitle(event: Event) {
    event.preventDefault();
    titleField.current?.focus({ preventScroll: true });
  }

  function stayOnTheNewDoc(event: Event) {
    if (!hasCreated.current) return;
    hasCreated.current = false;
    event.preventDefault();
  }

  function create() {
    startCreating(async () => {
      if (!(await items.createDoc(shelfId, title.trim()))) return;
      hasCreated.current = true;
      handleOpenChange(false);
      onCreated?.();
    });
  }

  const form = (
    <NewDocForm
      titleRef={titleField}
      title={title}
      isCreating={isCreating}
      onTitleChange={setTitle}
      onCreate={create}
    />
  );

  return isWide ? (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align="start"
        aria-labelledby={headingId}
        className="grid gap-3"
        onOpenAutoFocus={focusTitle}
        onCloseAutoFocus={stayOnTheNewDoc}
      >
        <h2 id={headingId} className="font-semibold">
          {t('newDoc')}
        </h2>
        {form}
      </PopoverContent>
    </Popover>
  ) : (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent
        aria-describedby={undefined}
        onOpenAutoFocus={focusTitle}
        onCloseAutoFocus={stayOnTheNewDoc}
      >
        <DrawerHeader>
          <DrawerTitle>{t('newDoc')}</DrawerTitle>
        </DrawerHeader>
        {form}
      </DrawerContent>
    </Drawer>
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
