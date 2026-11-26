import type { Editor } from '@tiptap/core';
import { closeHistory } from '@tiptap/pm/history';
import { Fragment, type Node } from '@tiptap/pm/model';
import {
  type EditorState,
  TextSelection,
  type Transaction,
} from '@tiptap/pm/state';

import { BLOCK_ID } from './block-ids';
import { blocksAt } from './blocks-at';
import { ANSWER, CARD, QUESTION } from './card-parts';
import { insertBlock } from './insert-block';
import { toggleCard } from './open-cards';

const LINES = ['paragraph', 'heading'];

type BlocksForACard = { from: number; to: number; blocks: Node[] };

export function makeCard(editor: Editor) {
  const blocks = blocksForACard(editor.state);
  if (blocks) {
    editor.commands.focus();
    const { tr } = editor.state;
    closeHistory(tr);
    const hasAnAnswer = turnIntoACard(tr, blocks);
    editor.view.dispatch(tr);
    if (hasAnAnswer) {
      editor.view.dispatch(toggleCard(editor.state.tr, blocks.from));
    }
    return true;
  }
  if (!canPutACardUnderTheLine(editor.state)) return false;
  const { from } = editor.state.selection;
  editor.commands.focus();
  insertBlock(editor, { from, to: from }, 'card');
  return true;
}

export function canMakeCard(state: EditorState) {
  return blocksForACard(state) !== null || canPutACardUnderTheLine(state);
}

function blocksForACard({
  selection,
  doc,
}: EditorState): BlocksForACard | null {
  const { $from } = selection;
  if (isWithinALine(selection)) {
    const isTopLevelLine = $from.depth === 1 && isLine($from.parent);
    return isTopLevelLine
      ? { from: $from.before(1), to: $from.after(1), blocks: [$from.parent] }
      : null;
  }
  const range = $from.blockRange(
    lastSelectedIn(doc, selection),
    (node) => node === doc,
  );
  if (!range) return null;
  const blocks: Node[] = [];
  for (let index = range.startIndex; index < range.endIndex; index += 1) {
    blocks.push(doc.child(index));
  }
  return blocks.some(holdsACard) || !blocks.some(isContent)
    ? null
    : { from: range.start, to: range.end, blocks };
}

export function turnTheLineIntoACard(
  tr: Transaction,
  range: { from: number; to: number },
) {
  const $start = tr.doc.resolve(range.from);
  if ($start.depth !== 1 || $start.parent.type.name !== 'paragraph') {
    return false;
  }
  tr.delete(range.from, range.to);
  const from = $start.before(1);
  const line = tr.doc.nodeAt(from);
  if (!line) return false;
  turnIntoACard(tr, { from, to: from + line.nodeSize, blocks: [line] });
  return true;
}

function turnIntoACard(tr: Transaction, { from, to, blocks }: BlocksForACard) {
  const { schema } = tr.doc.type;
  const filled = withoutEmptyEnds(blocks);
  const [first, ...rest] = filled;
  const startsWithALine = first !== undefined && isLine(first);
  const question = startsWithALine ? questionFrom(first) : Fragment.empty;
  const answer = withoutEmptyEnds(answerFrom(startsWithALine ? rest : filled));
  const card = schema.node(CARD, null, [
    schema.node(QUESTION, null, question),
    schema.node(
      ANSWER,
      null,
      answer.length > 0 ? answer : schema.node('paragraph'),
    ),
  ]);
  tr.replaceWith(from, to, card);
  tr.setSelection(TextSelection.create(tr.doc, from + 2 + question.size));
  tr.scrollIntoView();
  return answer.length > 0;
}

function canPutACardUnderTheLine(state: EditorState) {
  return (
    isWithinALine(state.selection) &&
    blocksAt(state.selection.$from).includes('card')
  );
}

function lastSelectedIn(doc: Node, { $from, $to }: EditorState['selection']) {
  const endsAtABlockStart = $to.parentOffset === 0 && $to.pos > $from.pos;
  return endsAtABlockStart ? doc.resolve($to.pos - 1) : $to;
}

function isWithinALine({ $from, $to }: EditorState['selection']) {
  return $from.sameParent($to) && $from.parent.isTextblock;
}

function isLine(node: Node) {
  return LINES.includes(node.type.name);
}

function withoutEmptyEnds(blocks: Node[]) {
  const start = blocks.findIndex(isFilled);
  const end = blocks.findLastIndex(isFilled);
  return start === -1 ? [] : blocks.slice(start, end + 1);
}

function isFilled(block: Node) {
  return !(block.type.name === 'paragraph' && block.content.size === 0);
}

function isContent(block: Node) {
  return isFilled(block) && block.type.name !== 'horizontalRule';
}

function holdsACard(node: Node) {
  let holds = node.type.name === CARD;
  node.descendants((child) => {
    holds ||= child.type.name === CARD;
    return !holds;
  });
  return holds;
}

function questionFrom(line: Node) {
  const inline: Node[] = [];
  line.content.forEach((node) => {
    inline.push(node.isText ? node : line.type.schema.text(' ', node.marks));
  });
  return Fragment.from(inline);
}

function answerFrom(blocks: Node[]): Node[] {
  return blocks.flatMap((block) => {
    switch (block.type.name) {
      case 'heading':
        return [
          block.type.schema.node(
            'paragraph',
            { [BLOCK_ID]: block.attrs[BLOCK_ID] as unknown },
            block.content,
          ),
        ];
      case 'blockquote':
        return answerFrom(childrenOf(block));
      case 'horizontalRule':
        return [];
      default:
        return [block];
    }
  });
}

function childrenOf(node: Node) {
  const children: Node[] = [];
  node.forEach((child) => children.push(child));
  return children;
}
