import type { JSONContent } from '@tiptap/core';

const INLINE = ['text', 'hardBreak'];

export function plainTextOf(node: JSONContent): string {
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak') return '\n';
  const children = node.content ?? [];
  const holdsText = children.some(({ type = '' }) => INLINE.includes(type));
  return children
    .map(plainTextOf)
    .filter((part) => part !== '')
    .join(holdsText ? '' : '\n');
}
