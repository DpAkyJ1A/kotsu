import { Extension, type NodeViewRenderer } from '@tiptap/core';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import type { Node } from '@tiptap/pm/model';
import { StarterKit } from '@tiptap/starter-kit';

import type { Colouring } from './apply-colour';
import { BLOCK_ID, BlockIds } from './block-ids';
import { Card } from './card';
import { CARD } from './card-parts';
import { FIRST_LAST_COLOUR } from './last-colour';
import { TextColour } from './text-colour';

export const HEADING_LEVELS = [1, 2, 3] as const;

export const BLOCKS_WITH_AN_ID = [
  'paragraph',
  'heading',
  'listItem',
  'taskItem',
  'blockquote',
  'codeBlock',
  CARD,
];

type DocKitOptions = {
  checklistItemLabel: (item: Node) => string;
  lastColour: () => Colouring;
  cardView: NodeViewRenderer | null;
};

export const DocKit = Extension.create<DocKitOptions>({
  name: 'docKit',

  addOptions() {
    return {
      checklistItemLabel: (item) => item.textContent,
      lastColour: () => FIRST_LAST_COLOUR,
      cardView: null,
    };
  },

  addExtensions() {
    return [
      StarterKit.configure({
        heading: { levels: [...HEADING_LEVELS] },
        underline: false,
        link: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        a11y: { checkboxLabel: this.options.checklistItemLabel },
      }),
      TextColour.configure({ lastColour: this.options.lastColour }),
      Card.configure({ view: this.options.cardView }),
      BlockIds.configure({
        attributeName: BLOCK_ID,
        types: BLOCKS_WITH_AN_ID,
      }),
    ];
  },
});
