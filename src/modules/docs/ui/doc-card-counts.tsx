import type { Editor } from '@tiptap/core';
import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { use } from 'react';

import type { CardStatus } from '@/lib/card-statuses';

import { cardCountsOf } from '../core/card-counts';
import { useEditorDoc } from '../hooks/use-editor-doc';
import { CardStatusesContext } from './card-statuses';

const SHOWN_IN_ORDER = ['got_it', 'review', 'new'] as const;

const STATUS_DOTS = {
  got_it: 'bg-green-foreground',
  review: 'bg-amber-foreground',
  new: 'bg-muted-foreground',
} as const satisfies Record<CardStatus, string>;

type DocCardCountsProps = { editor: Editor | null };

export function DocCardCounts({ editor }: DocCardCountsProps) {
  const t = useTranslations('docs.card.counts');
  const statuses = use(CardStatusesContext);
  const doc = useEditorDoc(editor);
  const counts = doc && cardCountsOf(doc, statuses);
  if (!counts?.total) return null;

  return (
    <p className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted-foreground tabular-nums">
      <span>{t('cards', { count: counts.total })}</span>
      {SHOWN_IN_ORDER.filter((status) => counts[status] > 0).map((status) => (
        <span key={status} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn('size-1.5 rounded-full', STATUS_DOTS[status])}
          />
          {t(status, { count: counts[status] })}
        </span>
      ))}
    </p>
  );
}
