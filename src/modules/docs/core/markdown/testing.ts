import type { JSONContent } from '@tiptap/core';

import { DocBody } from '../doc-body';

type Mark = NonNullable<JSONContent['marks']>[number];

export function docOf(...content: JSONContent[]): JSONContent {
  return { type: 'doc', content };
}

export function text(value: string, ...marks: Mark[]): JSONContent {
  return { type: 'text', text: value, ...(marks.length ? { marks } : {}) };
}

export function paragraph(...content: (JSONContent | string)[]): JSONContent {
  return {
    type: 'paragraph',
    content: content.map((part) =>
      typeof part === 'string' ? text(part) : part,
    ),
  };
}

export function heading(level: number, value: string): JSONContent {
  return { type: 'heading', attrs: { level }, content: [text(value)] };
}

export function listOf(type: string, ...items: JSONContent[][]): JSONContent {
  const itemType = type === 'taskList' ? 'taskItem' : 'listItem';
  return {
    type,
    content: items.map((content) => ({ type: itemType, content })),
  };
}

export function card(
  question: JSONContent[],
  ...answer: JSONContent[]
): JSONContent {
  return {
    type: 'details',
    content: [
      { type: 'detailsSummary', content: question },
      { type: 'detailsContent', content: answer },
    ],
  };
}

export function codeBlock(code: string, language?: string): JSONContent {
  return {
    type: 'codeBlock',
    ...(language ? { attrs: { language } } : {}),
    content: code ? [text(code)] : [],
  };
}

export const BOLD: Mark = { type: 'bold' };
export const ITALIC: Mark = { type: 'italic' };
export const STRIKE: Mark = { type: 'strike' };
export const CODE: Mark = { type: 'code' };

export function colour(color: string | null, backgroundColor: string | null) {
  return { type: 'textStyle', attrs: { color, backgroundColor } };
}

export const HARD_BREAK: JSONContent = { type: 'hardBreak' };

export function stored(doc: JSONContent) {
  return DocBody.parse(withoutBlockIds(doc));
}

function withoutBlockIds(node: JSONContent): JSONContent {
  const attrs = Object.fromEntries(
    Object.entries(node.attrs ?? {}).filter(([name]) => name !== 'blockId'),
  );
  return {
    ...node,
    ...(node.attrs ? { attrs } : {}),
    ...(node.content ? { content: node.content.map(withoutBlockIds) } : {}),
  };
}
