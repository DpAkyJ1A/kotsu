import type { Editor } from '@tiptap/core';
import { cn } from 'cn';
import Link, { type LinkProps } from 'next/link';
import { useFormatter, useNow, useTranslations } from 'next-intl';

import { useFormatSize } from '@/modules/shelves';

import { saveIndicatorOf, shownSizeOf } from '../core/save-indicator';
import { LARGEST_DOC_BYTES } from '../core/save-limits';
import type { SaveStatus } from '../core/save-state';
import { textCountsOf } from '../core/text-counts';
import { useEditorDoc } from '../hooks/use-editor-doc';
import { DocCeiling } from './doc-ceiling';
import { DocFillBar } from './doc-fill-bar';

const UPDATES_THE_TIME_EVERY_MS = 10_000;

type DocDetailsProps = {
  status: SaveStatus;
  sizeBytes: number;
  savedAt: number | null;
  editor: Editor | null;
  storageHref: LinkProps<string>['href'];
};

export function DocDetails({
  status,
  sizeBytes,
  savedAt,
  editor,
  storageHref,
}: DocDetailsProps) {
  const t = useTranslations('docs.details');
  const format = useFormatter();
  const formatSize = useFormatSize();
  const doc = useEditorDoc(editor);
  const counts = doc && textCountsOf(doc);
  const { mark, warnsTheDocIsAlmostFull } = saveIndicatorOf(status, sizeBytes);

  return (
    <div className="flex flex-col gap-4 text-sm">
      <SaveSummary
        status={status}
        isAProblem={mark === 'problem'}
        storageHref={storageHref}
      />
      {warnsTheDocIsAlmostFull && (
        <p className="font-medium text-amber-foreground">{t('almostFull')}</p>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <dt className="text-muted-foreground">{t('size')}</dt>
        <dd className="grid justify-items-end gap-1.5 tabular-nums">
          {t('sizeOf', {
            size: formatSize(shownSizeOf(sizeBytes)),
            largest: formatSize(LARGEST_DOC_BYTES),
          })}
          <DocFillBar sizeBytes={sizeBytes} className="w-full" />
        </dd>
        {counts && (
          <>
            <dt className="text-muted-foreground">{t('words')}</dt>
            <dd className="text-end tabular-nums">
              {format.number(counts.words)}
            </dd>
            <dt className="text-muted-foreground">{t('characters')}</dt>
            <dd className="text-end tabular-nums">
              {format.number(counts.characters)}
            </dd>
          </>
        )}
        {savedAt !== null && <SavedAt savedAt={savedAt} />}
      </dl>
      <DocCeiling />
    </div>
  );
}

type SaveSummaryProps = Pick<DocDetailsProps, 'status' | 'storageHref'> & {
  isAProblem: boolean;
};

function SaveSummary({ status, isAProblem, storageHref }: SaveSummaryProps) {
  const t = useTranslations('docs');

  if (status === 'storageFull') {
    return (
      <div className="grid gap-1">
        <p className="font-semibold text-destructive">
          {t('storageFull.title')}
        </p>
        <p className="text-muted-foreground">
          {t('storageFull.hint')}{' '}
          <Link
            href={storageHref}
            className="font-semibold text-foreground underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t('storageFull.link')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-1">
      <p className={cn('font-semibold', isAProblem && 'text-destructive')}>
        {t(`details.summary.${status}.title`)}
      </p>
      <p className="text-muted-foreground">
        {t(`details.summary.${status}.hint`)}
      </p>
    </div>
  );
}

function SavedAt({ savedAt }: { savedAt: number }) {
  const t = useTranslations('docs.details');
  const format = useFormatter();
  const now = useNow({ updateInterval: UPDATES_THE_TIME_EVERY_MS });

  return (
    <>
      <dt className="text-muted-foreground">{t('savedAt')}</dt>
      <dd className="text-end tabular-nums">
        <time dateTime={new Date(savedAt).toISOString()}>
          {format.relativeTime(savedAt, Math.max(now.getTime(), savedAt))}
        </time>
      </dd>
    </>
  );
}
