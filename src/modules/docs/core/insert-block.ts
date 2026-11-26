import type { CommandProps, Editor, Range, SingleCommands } from '@tiptap/core';
import { closeHistory } from '@tiptap/pm/history';
import type { ResolvedPos } from '@tiptap/pm/model';
import type { Transaction } from '@tiptap/pm/state';
import { canJoin, liftTarget } from '@tiptap/pm/transform';

import type { SlashBlock } from './slash-blocks';

const LIST_ITEMS = new Set(['listItem', 'taskItem']);

const TURN_PLAIN_LINE_INTO: Record<
  SlashBlock,
  (commands: SingleCommands) => boolean
> = {
  text: () => true,
  heading1: (commands) => commands.setHeading({ level: 1 }),
  heading2: (commands) => commands.setHeading({ level: 2 }),
  heading3: (commands) => commands.setHeading({ level: 3 }),
  bulletList: (commands) => startList(commands, 'bulletList'),
  orderedList: (commands) => startList(commands, 'orderedList'),
  taskList: (commands) => startList(commands, 'taskList'),
  card: (commands) => commands.setDetails(),
  blockquote: (commands) => commands.setBlockquote(),
  codeBlock: (commands) => commands.setCodeBlock(),
  horizontalRule: (commands) =>
    commands.insertContent([{ type: 'horizontalRule' }, { type: 'paragraph' }]),
};

export function insertBlock(editor: Editor, range: Range, block: SlashBlock) {
  const isAlreadyInThePickedListOrQuote =
    containerOf(editor.state.doc.resolve(range.from)) === block;
  const chain = editor
    .chain()
    .command(startNewUndoStep)
    .deleteRange(range)
    .command(goToLineEnd)
    .command(openLineBelowUnlessEmpty);
  if (!isAlreadyInThePickedListOrQuote) {
    chain
      .command(liftOutOfListsAndQuotes)
      .command(makeParagraph)
      .command(({ commands }) => TURN_PLAIN_LINE_INTO[block](commands));
  }
  chain.scrollIntoView().run();
}

function containerOf($pos: ResolvedPos) {
  for (let depth = $pos.depth - 1; depth > 0; depth -= 1) {
    const { name } = $pos.node(depth).type;
    if (!LIST_ITEMS.has(name)) return name;
  }
  return 'doc';
}

function startNewUndoStep({ tr }: CommandProps) {
  closeHistory(tr);
  return true;
}

function goToLineEnd({ tr, commands }: CommandProps) {
  return commands.setTextSelection(tr.selection.$from.end());
}

function openLineBelowUnlessEmpty({ tr, commands }: CommandProps) {
  const { $from } = tr.selection;
  if ($from.parent.content.size === 0) return true;
  const item = $from.node(-1).type.name;
  return LIST_ITEMS.has(item)
    ? commands.splitListItem(item)
    : commands.splitBlock();
}

function liftOutOfListsAndQuotes({ tr }: CommandProps) {
  liftLine(tr);
  return true;
}

function liftLine(tr: Transaction) {
  const range = tr.selection.$from.blockRange();
  const depth = range && liftTarget(range);
  if (!range || typeof depth !== 'number') return;
  tr.lift(range, depth);
  liftLine(tr);
}

function makeParagraph({ tr, commands }: CommandProps) {
  return (
    tr.selection.$from.parent.type.name === 'paragraph' ||
    commands.setParagraph()
  );
}

function startList(commands: SingleCommands, list: string) {
  return commands.wrapInList(list) && commands.command(joinTheSameListAbove);
}

function joinTheSameListAbove({ tr }: CommandProps) {
  const { $from } = tr.selection;
  const listStart = $from.before(-2);
  const above = tr.doc.resolve(listStart).nodeBefore;
  if (above?.type === $from.node(-2).type && canJoin(tr.doc, listStart)) {
    tr.join(listStart);
  }
  return true;
}
