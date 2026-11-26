import type { JSONContent } from '@tiptap/core';

import { BLOCK_ID } from './block-ids';
import { CARD } from './card-parts';
import { docToMarkdown } from './markdown/doc-to-markdown';
import { plainTextOf } from './plain-text';

export function cardsInDoc(doc: JSONContent) {
  const seen = new Set<string>();
  const cards = [];
  for (const node of cardNodesIn(doc)) {
    const blockId: unknown = node.attrs?.[BLOCK_ID];
    if (typeof blockId !== 'string' || seen.has(blockId)) return null;
    seen.add(blockId);
    cards.push({ blockId, position: cards.length, ...sidesOf(node) });
  }
  return cards;
}

function cardNodesIn(node: JSONContent): JSONContent[] {
  if (node.type === CARD) return [node];
  return (node.content ?? []).flatMap(cardNodesIn);
}

function sidesOf(card: JSONContent) {
  const [question, answer] = card.content ?? [];
  return {
    front: question ? plainTextOf(question) : '',
    back: docToMarkdown({ type: 'doc', content: answer?.content ?? [] }),
  };
}
