'use client';

import { EditorContent } from '@tiptap/react';
import { cn } from 'cn';
import type { LinkProps } from 'next/link';
import type { ComponentProps } from 'react';

import { DocBreadcrumb, DocTitle } from '@/modules/shelves';

import type { Doc } from '../core/doc';
import { useDocEditor } from '../hooks/use-doc-editor';
import { useDocSaving } from '../hooks/use-doc-saving';
import { ConflictDialog } from './conflict-dialog';
import { DocBar } from './doc-bar';
import { DocSaveStatus } from './doc-save-status';
import { DocToolbar } from './doc-toolbar';
import { StorageFullBanner } from './storage-full-banner';

const BODY_CLASS_NAME = cn(
  'flex flex-1 flex-col text-base leading-7 [&_.tiptap]:flex-1 [&_.tiptap]:pb-24 [&_.tiptap]:outline-none',
  '[&_.shows-hint]:before:pointer-events-none [&_.shows-hint]:before:float-left [&_.shows-hint]:before:h-0 [&_.shows-hint]:before:text-muted-foreground [&_.shows-hint]:before:content-[attr(data-placeholder)_/_""] [&_.shows-hint]:before:[-webkit-nbsp-mode:normal]',
  '[&_p]:my-3',
  '[&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:leading-snug [&_h1]:font-bold [&_h1]:tracking-tight',
  '[&_h2]:mt-7 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:leading-snug [&_h2]:font-bold [&_h2]:tracking-tight',
  '[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:leading-snug [&_h3]:font-semibold',
  '[&_li]:my-1 [&_li_ol]:my-1 [&_li_p]:my-0 [&_li_ul]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0.5',
  '[&_ul[data-type=taskList]>li]:flex [&_ul[data-type=taskList]>li]:gap-2.5 [&_ul[data-type=taskList]>li>div]:min-w-0 [&_ul[data-type=taskList]>li>div]:flex-1',
  '[&_ul[data-type=taskList]_input]:size-4 [&_ul[data-type=taskList]_input]:accent-primary [&_ul[data-type=taskList]>li>label]:flex [&_ul[data-type=taskList]>li>label]:h-7 [&_ul[data-type=taskList]>li>label]:items-center',
  '[&_li[data-checked=true]>div>p]:text-muted-foreground [&_li[data-checked=true]>div>p]:line-through',
  '[&_blockquote]:my-4 [&_blockquote]:border-l-3 [&_blockquote]:border-input [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
  '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:px-4 [&_pre]:py-3 [&_pre]:text-sm [&_pre]:leading-6',
  '[&_:not(pre)>code]:rounded-xs [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-sm [&_code]:font-mono',
  '[&_hr]:my-6 [&_hr]:border-border',
);

type DocEditorProps = {
  doc: Doc;
  title: string;
  place: ComponentProps<typeof DocBreadcrumb>;
  storageHref: LinkProps<string>['href'];
};

export function DocEditor({ doc, title, place, storageHref }: DocEditorProps) {
  const editor = useDocEditor(doc.content);
  const saving = useDocSaving(editor, doc);

  return (
    <div className="@container flex flex-1 flex-col">
      <DocBar
        place={<DocBreadcrumb {...place} />}
        status={<DocSaveStatus status={saving.status} />}
        toolbar={<DocToolbar editor={editor} />}
      />
      <article className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-2 px-6 pt-6">
        {saving.status === 'storageFull' && (
          <StorageFullBanner storageHref={storageHref} />
        )}
        <DocTitle
          id={doc.id}
          title={title}
          onGoToBody={() => editor?.commands.focus('start')}
        />
        <EditorContent editor={editor} className={BODY_CLASS_NAME} />
      </article>
      <ConflictDialog
        isOpen={saving.isAskingAboutAConflict}
        onReload={saving.reload}
        onKeepMine={saving.keepMine}
        onDecideLater={saving.decideLater}
      />
    </div>
  );
}
