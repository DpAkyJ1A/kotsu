'use client';

import { useTranslations } from 'next-intl';
import {
  type Ref,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { findSlashBlocks, type SlashBlock } from '../core/slash-blocks';
import { ICONS } from './format-icons';

const STEPS: Partial<Record<string, number>> = { ArrowDown: 1, ArrowUp: -1 };
const SCROLL_THE_LIST_ONLY = {
  block: 'nearest',
  container: 'nearest',
} as const;

export type SlashMenuListHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

export type SlashMenuListProps = {
  query: string;
  editorElement: HTMLElement;
  onPick: (block: SlashBlock) => void;
  ref?: Ref<SlashMenuListHandle>;
};

export function SlashMenuList({
  query,
  editorElement,
  onPick,
  ref,
}: SlashMenuListProps) {
  const t = useTranslations('docs.slashMenu');
  const id = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const blocks = findSlashBlocks(query, (block) => t(`${block}.label`));
  const [highlight, setHighlight] = useState({ query, index: 0 });
  const activeIndex = highlight.query === query ? highlight.index : 0;
  const active = blocks[activeIndex];
  const listId = `${id}-list`;
  const optionId = (block: SlashBlock) => `${id}-${block}`;
  const activeId = active && optionId(active);

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (!active) return false;
      if (event.key === 'Enter') {
        onPick(active);
        return true;
      }
      const step = STEPS[event.key];
      if (step === undefined) return false;
      const count = blocks.length;
      setHighlight({ query, index: (activeIndex + step + count) % count });
      return true;
    },
  }));

  useEffect(() => {
    if (!activeId) return;
    editorElement.setAttribute('aria-controls', listId);
    editorElement.setAttribute('aria-activedescendant', activeId);
    return () => {
      editorElement.removeAttribute('aria-controls');
      editorElement.removeAttribute('aria-activedescendant');
    };
  }, [editorElement, listId, activeId]);

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView(SCROLL_THE_LIST_ONLY);
  }, [activeId]);

  return (
    <div className="flex max-h-(--available-height) w-64 animate-fade-in flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl">
      <p
        id={`${id}-title`}
        className="shrink-0 px-3.5 pt-2.5 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
      >
        {t('title')}
      </p>
      {active && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={`${id}-title`}
          className="max-h-80 min-h-0 scroll-py-1.5 overflow-y-auto overscroll-contain p-1.5 pt-0"
        >
          {blocks.map((block, index) => {
            const Icon = ICONS[block];
            return (
              <button
                key={block}
                type="button"
                id={optionId(block)}
                role="option"
                tabIndex={-1}
                aria-selected={block === active}
                className="group flex w-full cursor-default items-center gap-2.5 rounded-lg px-2 py-1.5 text-left select-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                onPointerMove={() => {
                  setHighlight({ query, index });
                }}
                onClick={() => {
                  onPick(block);
                }}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground group-aria-selected:bg-violet group-aria-selected:text-violet-foreground">
                  <Icon className="size-3.5" />
                </span>
                <span className="grid min-w-0">
                  <span className="truncate text-sm">
                    {t(`${block}.label`)}
                  </span>{' '}
                  <span className="truncate text-xs text-muted-foreground group-aria-selected:text-foreground/75">
                    {t(`${block}.description`)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      <p role="status" className="text-sm text-muted-foreground">
        {active ? null : (
          <span className="block px-3.5 pt-1 pb-3">{t('empty')}</span>
        )}
      </p>
    </div>
  );
}
