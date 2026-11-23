import { Editor, type JSONContent } from '@tiptap/core';
import type { Transaction } from '@tiptap/pm/state';
import { expect, onTestFinished, test } from 'vitest';

import { DocKit } from './doc-kit';
import { isUserEdit } from './user-edit';

const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/;

async function openedEditor(content: JSONContent | null) {
  const transactions: Transaction[] = [];
  const created = Promise.withResolvers<Editor>();
  const editor = new Editor({
    element: document.body.appendChild(document.createElement('div')),
    extensions: [DocKit],
    content,
    onTransaction: ({ transaction }) => transactions.push(transaction),
    onCreate: ({ editor: opened }) => {
      created.resolve(opened);
    },
  });
  onTestFinished(() => {
    editor.destroy();
  });
  await created.promise;
  return { editor, transactions };
}

test('the ids UniqueID sets on a doc opened without them change the doc but are not an edit', async () => {
  const { editor, transactions } = await openedEditor({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'hablo' }] },
    ],
  });

  expect(editor.state.doc.firstChild?.attrs.blockId).toMatch(UUID);
  expect(transactions.some((transaction) => transaction.docChanged)).toBe(true);
  expect(transactions.some(isUserEdit)).toBe(false);
});

test('the id UniqueID sets on the empty line of a new doc is not an edit', async () => {
  const { editor, transactions } = await openedEditor(null);

  expect(editor.state.doc.firstChild?.attrs.blockId).toMatch(UUID);
  expect(transactions.some(isUserEdit)).toBe(false);
});

test('typing a new line is an edit, though UniqueID gives the line its id in a transaction of its own', async () => {
  const { editor, transactions } = await openedEditor(null);
  transactions.length = 0;

  editor.commands.insertContent('hablo');
  editor.commands.splitBlock();

  expect(transactions.filter(isUserEdit)).toHaveLength(2);
});

test('an undo is an edit too, since it changes what is saved', async () => {
  const { editor, transactions } = await openedEditor(null);
  editor.commands.insertContent('hablo');
  transactions.length = 0;

  editor.commands.undo();

  expect(editor.getText()).toBe('');
  expect(transactions.filter(isUserEdit)).toHaveLength(1);
});
