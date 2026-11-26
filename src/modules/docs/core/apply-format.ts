import { CommandManager, type Editor, type SingleCommands } from '@tiptap/core';

import { blocksAt } from './blocks-at';
import { type Format, isToggle, type Toggle } from './formats';
import { insertBlock } from './insert-block';
import { canMakeCard, makeCard } from './make-card';

const TOGGLES: Record<Toggle, (commands: SingleCommands) => boolean> = {
  heading1: (commands) => commands.toggleHeading({ level: 1 }),
  heading2: (commands) => commands.toggleHeading({ level: 2 }),
  heading3: (commands) => commands.toggleHeading({ level: 3 }),
  bold: (commands) => commands.toggleBold(),
  italic: (commands) => commands.toggleItalic(),
  strike: (commands) => commands.toggleStrike(),
  code: (commands) => commands.toggleCode(),
  bulletList: (commands) => commands.toggleBulletList(),
  orderedList: (commands) => commands.toggleOrderedList(),
  taskList: (commands) => commands.toggleTaskList(),
  blockquote: (commands) => commands.toggleBlockquote(),
  codeBlock: (commands) => commands.toggleCodeBlock(),
};

const HEADING_LEVELS: Partial<Record<Toggle, number>> = {
  heading1: 1,
  heading2: 2,
  heading3: 3,
};

export function applyFormat(editor: Editor, format: Format) {
  if (format === 'card') {
    makeCard(editor);
    return;
  }
  if (!isToggle(format)) {
    insertUnderTheLine(editor, format);
    return;
  }
  editor
    .chain()
    .focus()
    .command(({ commands }) => TOGGLES[format](commands))
    .run();
}

export function isFormatOn(editor: Editor, format: Format) {
  if (!isToggle(format)) return false;
  const level = HEADING_LEVELS[format];
  return level === undefined
    ? editor.isActive(format)
    : editor.isActive('heading', { level });
}

export function canApplyFormat(editor: Editor, format: Format) {
  if (format === 'card') return canMakeCard(editor.state);
  if (!isToggle(format)) {
    return blocksAt(editor.state.selection.$from).includes(format);
  }
  const trial = new CommandManager({ editor, state: editor.state });
  return trial
    .createChain()
    .command(({ commands }) => TOGGLES[format](commands))
    .run();
}

function insertUnderTheLine(editor: Editor, block: Exclude<Format, Toggle>) {
  const { from } = editor.state.selection;
  editor.commands.focus();
  insertBlock(editor, { from, to: from }, block);
}
