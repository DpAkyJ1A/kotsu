'use client';

import type { Editor } from '@tiptap/core';
import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { useMediaQuery, WIDE_SCREEN } from '@/ui/use-media-query';

import type { OutlineHeading } from '../core/outline';
import { useCurrentHeading } from '../hooks/use-current-heading';
import { useDocOutline } from '../hooks/use-doc-outline';
import { showTheCurrentInside } from './show-the-current-inside';

const INDENT_BY_DEPTH = ['pl-2', 'pl-5', 'pl-8'];
const DASH_BY_DEPTH = ['w-4', 'w-3', 'w-2'];

type DocOutlineProps = { editor: Editor | null };

export function DocOutline({ editor }: DocOutlineProps) {
  return useMediaQuery(WIDE_SCREEN) ? (
    <OutlineBesideTheText editor={editor} />
  ) : null;
}

function OutlineBesideTheText({ editor }: DocOutlineProps) {
  const outline = useDocOutline(editor);
  return editor !== null && outline.length > 0 ? (
    <Outline editor={editor} outline={outline} />
  ) : null;
}

type OutlineProps = { editor: Editor; outline: readonly OutlineHeading[] };

function Outline({ editor, outline }: OutlineProps) {
  const t = useTranslations('docs.outline');
  const { current, goTo } = useCurrentHeading(editor, outline);
  const dashes = useRef<HTMLDivElement>(null);
  const headings = useRef<HTMLOListElement>(null);

  useEffect(() => {
    showTheCurrentInside(dashes.current);
    showTheCurrentInside(headings.current);
  }, [current]);

  return (
    <nav
      aria-label={t('label')}
      data-slot="doc-outline"
      className="group relative mt-6"
    >
      <div
        ref={dashes}
        aria-hidden
        data-slot="doc-outline-dashes"
        className="flex max-h-[calc(100dvh-10rem)] flex-col items-end gap-2 overflow-hidden py-2 pr-4 pl-3 @6xl:hidden"
      >
        {outline.map(({ blockId, depth }) => (
          <span
            key={blockId}
            data-current={blockId === current || undefined}
            className={cn(
              'h-0.5 shrink-0 rounded-full',
              DASH_BY_DEPTH[depth],
              blockId === current ? 'bg-foreground' : 'bg-input',
            )}
          />
        ))}
      </div>
      <ol
        ref={headings}
        className={cn(
          'absolute top-0 right-2 flex max-h-[calc(100dvh-10rem)] w-64 flex-col gap-0.5 overflow-y-auto rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-md',
          'pointer-events-none opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100',
          '@6xl:pointer-events-auto @6xl:static @6xl:w-auto @6xl:max-w-64 @6xl:rounded-none @6xl:border-0 @6xl:bg-transparent @6xl:py-0 @6xl:pr-6 @6xl:pl-8 @6xl:opacity-100 @6xl:shadow-none',
        )}
      >
        {outline.map((heading) => (
          <li key={heading.blockId}>
            <button
              type="button"
              data-current={heading.blockId === current || undefined}
              aria-current={
                heading.blockId === current ? 'location' : undefined
              }
              onClick={() => {
                goTo(heading);
              }}
              className={cn(
                'block w-full truncate rounded-md py-1 pr-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                INDENT_BY_DEPTH[heading.depth],
                heading.blockId === current
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
