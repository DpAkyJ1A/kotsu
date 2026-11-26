import { getSchema, type JSONContent } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { describe, expect, test } from 'vitest';

import { cardCountsOf } from './card-counts';
import { DocKit } from './doc-kit';
import { card, docOf, listOf, paragraph, text } from './markdown/testing';

const schema = getSchema([DocKit]);

const KITCHEN = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f01';
const FRIDGE = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f02';
const OVEN = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f03';
const SINK = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f04';

function cardWithId(blockId: string, question: string): JSONContent {
  return { ...card([text(question)]), attrs: { blockId } };
}

function nodeOf(json: JSONContent) {
  return Node.fromJSON(schema, json);
}

describe('cardCountsOf', () => {
  test('counts the cards of the doc by the status each has in the index', () => {
    const doc = nodeOf(
      docOf(
        cardWithId(KITCHEN, 'la cocina'),
        paragraph('hola'),
        cardWithId(FRIDGE, 'la nevera'),
        cardWithId(OVEN, 'el horno'),
        listOf('bulletList', [paragraph('Más'), cardWithId(SINK, 'el grifo')]),
      ),
    );

    expect(
      cardCountsOf(doc, { [KITCHEN]: 'got_it', [FRIDGE]: 'review' }),
    ).toEqual({ total: 4, got_it: 1, review: 1, new: 2 });
  });

  test('counts a card the index has not seen yet as new', () => {
    const doc = nodeOf(docOf(cardWithId(KITCHEN, 'la cocina')));

    expect(cardCountsOf(doc, {})).toEqual({
      total: 1,
      got_it: 0,
      review: 0,
      new: 1,
    });
  });

  test('ignores statuses of cards that are no longer in the doc', () => {
    const doc = nodeOf(docOf(paragraph('hola')));

    expect(cardCountsOf(doc, { [KITCHEN]: 'got_it' })).toEqual({
      total: 0,
      got_it: 0,
      review: 0,
      new: 0,
    });
  });
});
