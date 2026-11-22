'use client';

import { useTranslations } from 'next-intl';
import type { KeyboardEvent } from 'react';

import { ITEM_TITLE_MAX_LENGTH } from '../core/item';
import { useItems } from '../hooks/use-items';
import { useTitleDraft } from '../hooks/use-title-draft';

type DocTitleProps = {
  id: string;
  title: string;
  onGoToBody: () => void;
};

export function DocTitle({ id, title, onGoToBody }: DocTitleProps) {
  const t = useTranslations('shelves.docs');
  const items = useItems();
  const saved = items.existing.find((doc) => doc.id === id)?.title ?? title;
  const draft = useTitleDraft(saved, (newTitle) => {
    items.rename(id, newTitle);
  });

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter' || isDownFromTheEnd(event)) {
      event.preventDefault();
      onGoToBody();
    }
  }

  return (
    <h1>
      <textarea
        aria-label={t('title')}
        placeholder={saved}
        value={draft.value}
        rows={1}
        maxLength={ITEM_TITLE_MAX_LENGTH}
        enterKeyHint="next"
        autoComplete="off"
        className="field-sizing-content w-full resize-none bg-transparent text-3xl leading-tight font-bold tracking-tight outline-none placeholder:text-muted-foreground md:text-4xl"
        onChange={(event) => {
          draft.change(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (document.hasFocus()) draft.finish();
        }}
      />
    </h1>
  );
}

function isDownFromTheEnd(event: KeyboardEvent<HTMLTextAreaElement>) {
  const { selectionStart, selectionEnd, value } = event.currentTarget;
  return (
    event.key === 'ArrowDown' &&
    selectionStart === value.length &&
    selectionEnd === value.length
  );
}
