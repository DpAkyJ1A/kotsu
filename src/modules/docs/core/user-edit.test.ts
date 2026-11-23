import { Editor, type JSONContent } from '@tiptap/core';
import type { Transaction } from '@tiptap/pm/state';
import { expect, test } from 'vitest';

import { DocKit } from './doc-kit';
import { isUserEdit } from './user-edit';

const BLOCK_ID = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f01';
const SAVED_BODY: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { blockId: BLOCK_ID },
      content: [{ type: 'text', text: 'hablo' }],
    },
  ],
};

function recordedEditor(content: JSONContent) {
  const transactions: Transaction[] = [];
  const editor = new Editor({
    element: null,
    extensions: [DocKit],
    content,
    onTransaction: ({ transaction }) => transactions.push(transaction),
  });
  return { editor, transactions };
}

test('typing and deleting are edits', () => {
  const { editor, transactions } = recordedEditor(SAVED_BODY);

  editor.commands.insertContentAt(6, { type: 'text', text: ', hablas' });
  editor.commands.deleteRange({ from: 1, to: 3 });

  expect(transactions.map(isUserEdit)).toEqual([true, true]);
});

test('moving the caret is not an edit', () => {
  const { editor, transactions } = recordedEditor(SAVED_BODY);

  editor.commands.setTextSelection(3);

  expect(transactions).toHaveLength(1);
  expect(transactions.some(isUserEdit)).toBe(false);
});

test('a body put in outside the undo history, as a version from the server is, is not an edit', () => {
  const { editor, transactions } = recordedEditor(SAVED_BODY);

  editor
    .chain()
    .setMeta('addToHistory', false)
    .setContent({
      ...SAVED_BODY,
      content: [{ type: 'paragraph', attrs: { blockId: BLOCK_ID } }],
    })
    .run();

  expect(transactions.some((transaction) => transaction.docChanged)).toBe(true);
  expect(transactions.some(isUserEdit)).toBe(false);
});
