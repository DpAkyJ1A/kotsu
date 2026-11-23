'use client';

import type { Editor } from '@tiptap/core';
import { cn } from 'cn';
import type { LinkProps } from 'next/link';
import { useTranslations } from 'next-intl';

import { CheckIcon, CircleAlertIcon } from '@/ui/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';

import { saveIndicatorOf, type SaveMark } from '../core/save-indicator';
import type { SaveStatus } from '../core/save-state';
import { useOpenOnHover } from '../hooks/use-open-on-hover';
import { DocDetails } from './doc-details';
import { DocFillBar } from './doc-fill-bar';

type DocSaveStatusProps = {
  status: SaveStatus;
  sizeBytes: number;
  savedAt: number | null;
  editor: Editor | null;
  storageHref: LinkProps<string>['href'];
};

export function DocSaveStatus(props: DocSaveStatusProps) {
  const { status, sizeBytes, savedAt } = props;
  const t = useTranslations('docs');
  const { mark, showsTheFill, warnsTheDocIsAlmostFull } = saveIndicatorOf(
    status,
    sizeBytes,
  );
  const popover = useOpenOnHover();

  return (
    <Popover {...popover.root}>
      <div role="status" className="shrink-0">
        <PopoverTrigger
          {...popover.trigger}
          className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=open]:bg-accent"
        >
          <Mark mark={mark} isAfterASave={savedAt !== null} />
          <span
            className={cn(
              mark === 'problem'
                ? 'font-medium text-red-foreground'
                : 'sr-only',
            )}
          >
            {t(`saveStatus.${status}`)}
          </span>
          {warnsTheDocIsAlmostFull && (
            <span className="font-medium text-foreground">
              {t('saveStatus.almostFull')}
            </span>
          )}
          {showsTheFill && <DocFillBar sizeBytes={sizeBytes} className="w-8" />}
        </PopoverTrigger>
      </div>
      <PopoverContent
        {...popover.content}
        align="end"
        aria-label={t('details.label')}
        className="w-80"
      >
        <DocDetails {...props} />
      </PopoverContent>
    </Popover>
  );
}

type MarkProps = { mark: SaveMark; isAfterASave: boolean };

function Mark({ mark, isAfterASave }: MarkProps) {
  if (mark === 'saving') {
    return (
      <span
        aria-hidden
        data-mark="saving"
        className="grid size-4 place-items-center"
      >
        <span className="size-2 rounded-full bg-muted-foreground motion-safe:animate-pulse" />
      </span>
    );
  }
  if (mark === 'saved') {
    return (
      <CheckIcon
        data-mark="saved"
        className={cn('size-4', isAfterASave && 'animate-just-done')}
      />
    );
  }
  return (
    <CircleAlertIcon
      data-mark="problem"
      className="size-4 text-red-foreground"
    />
  );
}
