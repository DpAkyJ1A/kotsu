import type { Transaction } from '@tiptap/pm/state';

export function isUserEdit(transaction: Transaction) {
  return (
    transaction.docChanged && transaction.getMeta('addToHistory') !== false
  );
}
