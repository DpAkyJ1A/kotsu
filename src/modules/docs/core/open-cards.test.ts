import { getSchema, type JSONContent } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { EditorState } from '@tiptap/pm/state';
import { DecorationSet } from '@tiptap/pm/view';
import { describe, expect, test } from 'vitest';

import { DocKit } from './doc-kit';
import { isCardOpen, openCards, toggleCard } from './open-cards';

const schema = getSchema([DocKit]);

function card(
  question: string,
  answer: JSONContent = { type: 'paragraph' },
): JSONContent {
  return {
    type: 'details',
    content: [
      { type: 'detailsSummary', content: [{ type: 'text', text: question }] },
      { type: 'detailsContent', content: [answer] },
    ],
  };
}

function stateWith(...content: JSONContent[]) {
  return EditorState.create({
    doc: Node.fromJSON(schema, { type: 'doc', content }),
    plugins: [openCards('details')],
  });
}

function positionsOfCards({ doc }: EditorState) {
  const positions: number[] = [];
  doc.forEach((node, offset) => {
    if (node.type.name === 'details') positions.push(offset);
  });
  return positions;
}

function toggled(state: EditorState, position: number) {
  return state.apply(toggleCard(state.tr, position));
}

function hiddenAt(state: EditorState) {
  const [plugin] = state.plugins;
  const decorations = plugin?.props.decorations?.call(plugin, state);
  const all = decorations instanceof DecorationSet ? decorations.find() : [];
  return all
    .filter(({ spec }) => !('isOpenCard' in spec))
    .map(({ from }) => from);
}

function answersOf({ doc }: EditorState) {
  const answers: number[] = [];
  doc.descendants((node, position) => {
    if (node.type.name === 'detailsContent') answers.push(position);
  });
  return answers;
}

describe('folded answers', () => {
  test('every answer of a folded card is hidden, a card pasted into a list in an answer too', () => {
    const state = stateWith(
      card('¿Qué?', {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph' }, card('¿Y?')],
          },
        ],
      }),
    );

    expect(hiddenAt(state)).toEqual(answersOf(state));
    expect(answersOf(state)).toHaveLength(2);
  });

  test('the answer of an open card is not hidden', () => {
    const state = toggled(stateWith(card('¿Qué?')), 0);

    expect(hiddenAt(state)).toEqual([]);
  });
});

describe('opening a card', () => {
  test('a card starts closed, and toggling opens and closes it', () => {
    const state = stateWith(card('¿Qué?'));
    const [position = -1] = positionsOfCards(state);
    expect(isCardOpen(state, position)).toBe(false);

    const opened = toggled(state, position);
    expect(isCardOpen(opened, position)).toBe(true);

    expect(isCardOpen(toggled(opened, position), position)).toBe(false);
  });

  test('opens only the card it is given', () => {
    const state = stateWith(card('¿Qué?'), card('¿Cómo?'));
    const [first = -1, second = -1] = positionsOfCards(state);

    const opened = toggled(state, second);

    expect(isCardOpen(opened, first)).toBe(false);
    expect(isCardOpen(opened, second)).toBe(true);
  });

  test('an open card stays open when text above it moves it down', () => {
    const state = stateWith({ type: 'paragraph' }, card('¿Qué?'));
    const opened = toggled(state, positionsOfCards(state)[0] ?? -1);

    const typed = opened.apply(opened.tr.insertText('Verbos', 1));

    const [moved = -1] = positionsOfCards(typed);
    expect(isCardOpen(typed, moved)).toBe(true);
  });

  test('is not an edit: it leaves the doc alone and stays out of the undo history', () => {
    const state = stateWith(card('¿Qué?'));
    const [position = -1] = positionsOfCards(state);

    const tr = toggleCard(state.tr, position);

    expect(tr.docChanged).toBe(false);
    expect(tr.getMeta('addToHistory')).toBe(false);
  });
});
