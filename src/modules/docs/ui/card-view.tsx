'use client';

import {
  NodeViewContent,
  NodeViewWrapper,
  type ReactNodeViewProps,
} from '@tiptap/react';
import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { type MouseEvent, use } from 'react';

import { Chip } from '@/ui/chip';
import { IconButton } from '@/ui/icon-button';
import { ChevronRightIcon, GalleryVerticalEndIcon } from '@/ui/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip';

import { toggleTheCard } from '../core/card-commands';
import { type CardStatus, statusOf } from '../core/card-status';
import { SHORTCUTS } from '../core/formats';
import { isOpenIn } from '../core/open-cards';
import { CardStatusesContext } from './card-statuses';
import { PlatformKeys } from './platform-keys';

const CARD_CLASS_NAME =
  'my-3 grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-start gap-x-2 rounded-xl border border-border p-2';

const QUESTION_AND_ANSWER_CLASS_NAME = cn(
  'col-start-3 row-start-1 min-w-0 py-0.5 [&_summary]:font-semibold',
  '[&_[data-type=detailsContent]]:mt-1.5 [&_[data-type=detailsContent]]:border-t [&_[data-type=detailsContent]]:border-dashed [&_[data-type=detailsContent]]:border-border [&_[data-type=detailsContent]]:pt-1.5',
  '[&_[data-type=detailsContent]>:first-child]:mt-0 [&_[data-type=detailsContent]>:last-child]:mb-0',
);

const STATUS_COLOURS = {
  new: 'neutral',
  review: 'amber',
  got_it: 'green',
} as const satisfies Record<CardStatus, string>;

export function CardView({
  node,
  editor,
  getPos,
  decorations,
}: ReactNodeViewProps) {
  const t = useTranslations('docs.card');
  const status = statusOf(use(CardStatusesContext), node.attrs.blockId);
  const isOpen = isOpenIn(decorations);
  const label = isOpen ? t('hide') : t('show');

  const toggle = () => {
    const position = getPos();
    if (position !== undefined) toggleTheCard(editor, position);
  };

  return (
    <NodeViewWrapper
      className={cn(
        CARD_CLASS_NAME,
        isOpen ? 'bg-background shadow-xs' : 'bg-sidebar',
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            contentEditable={false}
            size="sm"
            label={label}
            aria-expanded={isOpen}
            className="text-muted-foreground"
            onMouseDown={keepTheFocusInTheEditor}
            onClick={toggle}
          >
            <ChevronRightIcon
              className={cn(
                'transition-transform motion-reduce:transition-none',
                isOpen && 'rotate-90',
              )}
            />
          </IconButton>
        </TooltipTrigger>
        <TooltipContent>
          {label} <PlatformKeys binding={SHORTCUTS.card.keys} />
        </TooltipContent>
      </Tooltip>
      <span
        contentEditable={false}
        aria-hidden
        className="mt-1.5 grid size-5 place-items-center rounded-sm bg-violet text-violet-foreground"
      >
        <GalleryVerticalEndIcon className="size-3" />
      </span>
      {node.child(0).content.size === 0 && (
        <span
          contentEditable={false}
          aria-hidden
          className="pointer-events-none col-start-3 row-start-1 py-0.5 font-semibold text-muted-foreground select-none"
        >
          {t('question')}
        </span>
      )}
      <NodeViewContent className={QUESTION_AND_ANSWER_CLASS_NAME} />
      <Chip
        contentEditable={false}
        color={STATUS_COLOURS[status]}
        className="col-start-4 row-start-1 mt-1.5 mr-1"
      >
        {t(`status.${status}`)}
      </Chip>
    </NodeViewWrapper>
  );
}

function keepTheFocusInTheEditor(event: MouseEvent) {
  event.preventDefault();
}
