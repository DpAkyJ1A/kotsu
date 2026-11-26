import { type Editor, findParentNode } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';
import { Selection, TextSelection, type Transaction } from '@tiptap/pm/state';

import { ANSWER, CARD, QUESTION } from './card-parts';
import { isCardOpen, toggleCard } from './open-cards';

export function toggleTheCard(editor: Editor, cardPosition: number) {
  return editor.commands.command(({ tr, state }) => {
    const card = state.doc.nodeAt(cardPosition);
    if (card?.type.name !== CARD) return false;
    const isClosing = isCardOpen(state, cardPosition);
    toggleCard(tr, cardPosition);
    const answerStart = cardPosition + 1 + card.child(0).nodeSize;
    const answerEnd = cardPosition + card.nodeSize;
    const { from, to } = tr.selection;
    const reachesIntoTheAnswer = to > answerStart && from < answerEnd;
    if (isClosing && reachesIntoTheAnswer) {
      tr.setSelection(TextSelection.create(tr.doc, answerStart - 1));
    }
    return true;
  });
}

export function toggleTheCardAtTheCaret(editor: Editor) {
  const card = findParentNode(isCard)(editor.state.selection);
  return card !== undefined && toggleTheCard(editor, card.pos);
}

export function goToTheAnswer(editor: Editor) {
  const { $head } = editor.state.selection;
  if ($head.parent.type.name !== QUESTION) return false;
  const cardPosition = $head.before(-1);
  if (!isCardOpen(editor.state, cardPosition)) {
    editor.view.dispatch(toggleCard(editor.state.tr, cardPosition));
  }
  return editor.commands.command(({ tr }) => {
    const card = tr.doc.nodeAt(cardPosition);
    if (!card) return false;
    const answerStart = cardPosition + 1 + card.child(0).nodeSize;
    tr.setSelection(Selection.near(tr.doc.resolve(answerStart + 1)));
    tr.scrollIntoView();
    return true;
  });
}

export function leaveTheCard(editor: Editor) {
  const { $from, empty } = editor.state.selection;
  const answer = $from.depth >= 2 ? $from.node(-1) : null;
  const isOnTheEmptyLastLine =
    empty &&
    answer?.type.name === ANSWER &&
    answer.childCount > 1 &&
    $from.index(-1) === answer.childCount - 1 &&
    isEmptyLine($from.parent);
  if (!isOnTheEmptyLastLine) return false;
  return editor.commands.command(({ tr }) => {
    tr.delete($from.before(), $from.after());
    putTheCaretOnAnEmptyLineAt(tr, tr.mapping.map($from.after(-2)));
    return true;
  });
}

function putTheCaretOnAnEmptyLineAt(tr: Transaction, position: number) {
  if (!isEmptyLine(tr.doc.nodeAt(position))) {
    tr.insert(position, tr.doc.type.schema.node('paragraph'));
  }
  tr.setSelection(TextSelection.create(tr.doc, position + 1));
  tr.scrollIntoView();
}

function isEmptyLine(node: Node | null) {
  return node?.type.name === 'paragraph' && node.content.size === 0;
}

function isCard(node: Node) {
  return node.type.name === CARD;
}
