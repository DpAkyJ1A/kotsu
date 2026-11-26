import { Extension, InputRule, type NodeViewRenderer } from '@tiptap/core';
import {
  Details,
  DetailsContent,
  DetailsSummary,
} from '@tiptap/extension-details';

import {
  goToTheAnswer,
  leaveTheCard,
  toggleTheCardAtTheCaret,
} from './card-commands';
import { CARD } from './card-parts';
import { SHORTCUTS } from './formats';
import { makeCard, turnTheLineIntoACard } from './make-card';
import { openCards } from './open-cards';

const ANSWER_BLOCKS = [
  'paragraph',
  'bulletList',
  'orderedList',
  'taskList',
  'codeBlock',
];

type CardOptions = {
  view: NodeViewRenderer | null;
};

export const Card = Extension.create<CardOptions>({
  name: 'card',

  addOptions() {
    return { view: null };
  },

  addExtensions() {
    const { view } = this.options;
    return [
      Details.extend({
        addNodeView: () => view,
        addKeyboardShortcuts() {
          return {
            ...this.parent?.(),
            Enter: ({ editor }) => goToTheAnswer(editor),
            [SHORTCUTS.card.keys]: ({ editor }) =>
              toggleTheCardAtTheCaret(editor) || makeCard(editor),
          };
        },
        addInputRules: () => [
          new InputRule({
            find: /^\?\?\s$/,
            handler: ({ state, range }) =>
              turnTheLineIntoACard(state.tr, range) ? undefined : null,
          }),
        ],
        addProseMirrorPlugins() {
          return [...(this.parent?.() ?? []), openCards(CARD)];
        },
      }),
      DetailsSummary,
      DetailsContent.extend({
        content: `(${ANSWER_BLOCKS.join(' | ')})+`,
        addNodeView: () => null,
        addKeyboardShortcuts: () => ({
          Enter: ({ editor }) => leaveTheCard(editor),
        }),
      }),
    ];
  },
});
