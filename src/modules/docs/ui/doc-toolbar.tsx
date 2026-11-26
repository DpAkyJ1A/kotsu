'use client';

import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { Fragment, type MouseEvent } from 'react';

import { Toolbar, ToolbarButton, ToolbarSeparator } from '@/ui/toolbar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip';

import { canColour, coloursAt } from '../core/apply-colour';
import { applyFormat, canApplyFormat, isFormatOn } from '../core/apply-format';
import {
  type Format,
  isMark,
  isToggle,
  markdownOf,
  SHORTCUTS,
} from '../core/formats';
import { ICONS } from './format-icons';
import { PlatformKeys } from './platform-keys';
import { TextColours } from './text-colours';

const TEXT_GROUPS: Format[][] = [
  ['heading1', 'heading2', 'heading3'],
  ['bold', 'italic', 'strike', 'code'],
];

const BLOCK_GROUPS: Format[][] = [
  ['bulletList', 'orderedList', 'taskList'],
  ['blockquote', 'codeBlock', 'horizontalRule'],
  ['card'],
];

const FORMATS = [...TEXT_GROUPS, ...BLOCK_GROUPS].flat();

const NO_COLOURS = { text: null, background: null };

type DocToolbarProps = { editor: Editor | null };

export function DocToolbar({ editor }: DocToolbarProps) {
  const t = useTranslations('docs.toolbar');
  const caret = useEditorState({
    editor,
    selector: (snapshot) =>
      snapshot.editor && formatsAtTheCaret(snapshot.editor),
  });

  const buttonsOf = (group: Format[]) =>
    group.map((format) => (
      <FormatButton
        key={format}
        format={format}
        isOn={caret?.on.includes(format) ?? false}
        canApply={!caret?.unavailable.includes(format)}
        onApply={() => {
          if (editor) applyFormat(editor, format);
        }}
      />
    ));

  return (
    <Toolbar aria-label={t('label')}>
      {TEXT_GROUPS.map((group, index) => (
        <Fragment key={group.join()}>
          {index > 0 && <ToolbarSeparator />}
          {buttonsOf(group)}
        </Fragment>
      ))}
      <ToolbarSeparator />
      <TextColours
        editor={editor}
        current={caret?.colours ?? NO_COLOURS}
        canColour={caret?.canColour ?? true}
      />
      {BLOCK_GROUPS.map((group) => (
        <Fragment key={group.join()}>
          <ToolbarSeparator />
          {buttonsOf(group)}
        </Fragment>
      ))}
    </Toolbar>
  );
}

function formatsAtTheCaret(editor: Editor) {
  return {
    on: FORMATS.filter((format) => isFormatOn(editor, format)),
    unavailable: FORMATS.filter((format) => !canApplyFormat(editor, format)),
    colours: coloursAt(editor),
    canColour: canColour(editor),
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
  const markdown = markdownOf(format, t('toolbar.sampleText'));
  const Icon = ICONS[format];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToolbarButton
          label={label}
          aria-pressed={isToggle(format) ? isOn : undefined}
          disabled={!canApply}
          className={cn(
            format === 'card' &&
              'w-auto bg-violet px-2 text-violet-foreground hover:bg-violet/80 hover:text-violet-foreground @max-3xl:w-7 @max-3xl:px-0',
          )}
          onMouseDown={keepTheFocusInTheEditor}
          onClick={onApply}
        >
          {format === 'card' ? (
            <span className="flex items-center gap-1.5">
              <Icon className="size-4" />
              <span aria-hidden className="@max-3xl:hidden">
                {label}
              </span>
            </span>
          ) : (
            <Icon className="size-4" />
          )}
        </ToolbarButton>
      </TooltipTrigger>
      <TooltipContent>
        {label} {keys && <PlatformKeys binding={keys} />}{' '}
        {markdown && (
          <span className="font-mono text-background/70">{markdown}</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function keepTheFocusInTheEditor(event: MouseEvent) {
  event.preventDefault();
}
