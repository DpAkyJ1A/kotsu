import type { ResolvedPos } from '@tiptap/pm/model';

import { CARD, CARD_PARTS } from './card-parts';
import { EVERY_SLASH_BLOCK, type SlashBlock } from './slash-blocks';

const NODE_OF: Record<SlashBlock, string> = {
  text: 'paragraph',
  heading1: 'heading',
  heading2: 'heading',
  heading3: 'heading',
  bulletList: 'bulletList',
  orderedList: 'orderedList',
  taskList: 'taskList',
  card: CARD,
  blockquote: 'blockquote',
  codeBlock: 'codeBlock',
  horizontalRule: 'horizontalRule',
};

export function blocksAt($position: ResolvedPos) {
  const { contentMatch } = containerAt($position).type;
  const { nodes } = $position.doc.type.schema;
  return EVERY_SLASH_BLOCK.filter((block) => {
    const type = nodes[NODE_OF[block]];
    return type !== undefined && contentMatch.matchType(type) !== null;
  });
}

function containerAt($position: ResolvedPos) {
  for (let depth = $position.depth; depth > 0; depth -= 1) {
    const node = $position.node(depth);
    if (CARD_PARTS.includes(node.type.name)) return node;
  }
  return $position.doc;
}
