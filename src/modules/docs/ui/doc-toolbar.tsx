'use client';

import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { Fragment, type MouseEvent } from 'react';

import { Kbd } from '@/ui/kbd';
import { isApplePlatform, shortcutKeys } from '@/ui/shortcut';
import { Toolbar, ToolbarButton, ToolbarSeparator } from '@/ui/toolbar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip';

import { applyFormat, canApplyFormat, isFormatOn } from '../core/apply-format';
import {
  type Format,
  isMark,
  isToggle,
  markdownOf,
  SHORTCUTS,
} from '../core/formats';
import { ICONS } from './format-icons';

const GROUPS: Format[][] = [
  ['heading1', 'heading2', 'heading3'],
  ['bold', 'italic', 'strike', 'code'],
  ['bulletList', 'orderedList', 'taskList'],
  ['blockquote', 'codeBlock', 'horizontalRule'],
];

const FORMATS = GROUPS.flat();

type DocToolbarProps = { editor: Editor | null };

export function DocToolbar({ editor }: DocToolbarProps) {
  const t = useTranslations('docs.toolbar');
  const caret = useEditorState({
    editor,
    selector: (snapshot) =>
      snapshot.editor && formatsAtTheCaret(snapshot.editor),
  });

  return (
    <Toolbar
      aria-label={t('label')}
      className="sticky top-0 z-10 -mx-2 mb-4 border-b bg-background py-1.5 max-md:hidden"
    >
      {GROUPS.map((group, index) => (
        <Fragment key={group.join()}>
          {index > 0 && <ToolbarSeparator />}
          {group.map((format) => (
            <FormatButton
              key={format}
              format={format}
              isOn={caret?.on.includes(format) ?? false}
              canApply={!caret?.unavailable.includes(format)}
              onApply={() => {
                if (editor) applyFormat(editor, format);
              }}
            />
          ))}
        </Fragment>
      ))}
    </Toolbar>
  );
}

function formatsAtTheCaret(editor: Editor) {
  return {
    on: FORMATS.filter((format) => isFormatOn(editor, format)),
    unavailable: FORMATS.filter((format) => !canApplyFormat(editor, format)),
  };
}

type FormatButtonProps = {
  format: Format;
  isOn: boolean;
  canApply: boolean;
  onApply: () => void;
};

function FormatButton({ format, isOn, canApply, onApply }: FormatButtonProps) {
  const t = useTranslations('docs');
  const label = isMark(format)
    ? t(`toolbar.${format}`)
    : t(`slashMenu.${format}.label`);
  const { keys } = SHORTCUTS[format];
  const Icon = ICONS[format];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToolbarButton
          label={label}
          aria-pressed={isToggle(format) ? isOn : undefined}
          disabled={!canApply}
          onMouseDown={keepTheFocusInTheEditor}
          onClick={onApply}
        >
          <Icon className="size-4" />
        </ToolbarButton>
      </TooltipTrigger>
      <TooltipContent>
        {label} {keys && <PlatformKeys binding={keys} />}{' '}
        <span className="font-mono text-background/70">
          {markdownOf(format, t('toolbar.sampleText'))}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

function PlatformKeys({ binding }: { binding: string }) {
  const isApple = isApplePlatform(navigator.userAgent);
  return <Kbd>{shortcutKeys(binding, { isApple })}</Kbd>;
}

function keepTheFocusInTheEditor(event: MouseEvent) {
  event.preventDefault();
}
