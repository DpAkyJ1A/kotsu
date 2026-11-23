import { Extension } from '@tiptap/core';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { UniqueID } from '@tiptap/extension-unique-id';
import type { Node } from '@tiptap/pm/model';
import { StarterKit } from '@tiptap/starter-kit';

export const HEADING_LEVELS = [1, 2, 3] as const;

const BLOCKS_WITH_AN_ID = [
  'paragraph',
  'heading',
  'listItem',
  'taskItem',
  'blockquote',
  'codeBlock',
];

type DocKitOptions = {
  checklistItemLabel: (item: Node) => string;
};

export const DocKit = Extension.create<DocKitOptions>({
  name: 'docKit',

  addOptions() {
    return { checklistItemLabel: (item) => item.textContent };
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
      UniqueID.configure({
        attributeName: 'blockId',
        types: BLOCKS_WITH_AN_ID,
      }),
    ];
  },
});
