import { getSchema, type JSONContent } from '@tiptap/core';
import { Node, Slice } from '@tiptap/pm/model';
import { expect, test } from 'vitest';

import { withoutIdsTakenIn } from './block-ids';
import { DocKit } from './doc-kit';

const schema = getSchema([DocKit]);

const TAKEN = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f01';
const FREE = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f02';
const ALSO_FREE = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f03';

function paragraph(blockId: string, value: string): JSONContent {
  return {
    type: 'paragraph',
    attrs: { blockId },
    content: [{ type: 'text', text: value }],
  };
}

function card(blockId: string, answer: JSONContent): JSONContent {
  return {
    type: 'details',
    attrs: { blockId },
    content: [
      {
        type: 'detailsSummary',
        content: [{ type: 'text', text: '¿Qué?' }],
      },
      { type: 'detailsContent', content: [answer] },
    ],
  };
}

function docOf(...content: JSONContent[]) {
  return Node.fromJSON(schema, { type: 'doc', content });
}

function idsOf(slice: Slice) {
  const ids: unknown[] = [];
  slice.content.descendants(({ attrs }) => {
    if ('blockId' in attrs) ids.push(attrs.blockId);
  });
  return ids;
}

test('a pasted block keeps its id while the doc has no block with it, so a card cut and pasted back stays the same card', () => {
  const doc = docOf(paragraph(TAKEN, 'hablo'));
  const pasted = docOf(card(FREE, paragraph(ALSO_FREE, 'to speak'))).slice(0);

  expect(idsOf(withoutIdsTakenIn(doc, pasted))).toEqual([FREE, ALSO_FREE]);
});

test('a pasted block whose id the doc already has loses it, inside a card too, so a copy becomes a new block', () => {
  const doc = docOf(card(TAKEN, paragraph(FREE, 'to speak')));
  const pasted = docOf(card(TAKEN, paragraph(FREE, 'to speak'))).slice(0);

  expect(idsOf(withoutIdsTakenIn(doc, pasted))).toEqual([null, null]);
});

test('keeps the text and the open sides of the slice', () => {
  const doc = docOf(paragraph(TAKEN, 'hablo'));
  const pasted = new Slice(docOf(paragraph(TAKEN, 'tú hablas')).content, 1, 1);

  const kept = withoutIdsTakenIn(doc, pasted);

  expect(kept.content.textBetween(0, kept.content.size)).toBe('tú hablas');
  expect([kept.openStart, kept.openEnd]).toEqual([1, 1]);
});
