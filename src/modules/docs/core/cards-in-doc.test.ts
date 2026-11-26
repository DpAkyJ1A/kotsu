import type { JSONContent } from '@tiptap/core';
import { describe, expect, test } from 'vitest';

import { cardsInDoc } from './cards-in-doc';
import {
  BOLD,
  card,
  docOf,
  HARD_BREAK,
  heading,
  listOf,
  paragraph,
  text,
} from './markdown/testing';

const KITCHEN = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f01';
const FRIDGE = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f02';
const OVEN = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f03';

function cardWithId(
  blockId: unknown,
  question: JSONContent[],
  ...answer: JSONContent[]
): JSONContent {
  return { ...card(question, ...answer), attrs: { blockId } };
}

describe('cardsInDoc', () => {
  test('lists the cards in doc order, the question as text and the answer as Markdown', () => {
    const doc = docOf(
      heading(2, 'Kitchen'),
      cardWithId(KITCHEN, [text('la cocina')], paragraph('the kitchen')),
      paragraph('Then the fridge.'),
      cardWithId(
        FRIDGE,
        [text('la '), text('nevera', BOLD)],
        listOf('bulletList', [paragraph('the fridge')], [paragraph('Spain')]),
      ),
    );

    expect(cardsInDoc(doc)).toEqual([
      {
        blockId: KITCHEN,
        position: 0,
        front: 'la cocina',
        back: 'the kitchen\n',
      },
      {
        blockId: FRIDGE,
        position: 1,
        front: 'la nevera',
        back: '- the fridge\n- Spain\n',
      },
    ]);
  });

  test('keeps a line break in the question', () => {
    const doc = docOf(
      cardWithId(KITCHEN, [text('la cocina'), HARD_BREAK, text('el horno')]),
    );

    expect(cardsInDoc(doc)?.[0]?.front).toBe('la cocina\nel horno');
  });

  test('gives an empty answer as an empty string', () => {
    const doc = docOf(cardWithId(KITCHEN, [text('la cocina')]));

    expect(cardsInDoc(doc)?.[0]?.back).toBe('');
  });

  test('finds a card inside a list item', () => {
    const doc = docOf(
      listOf('bulletList', [
        paragraph('Rooms'),
        cardWithId(OVEN, [text('el horno')], paragraph('the oven')),
      ]),
    );

    expect(cardsInDoc(doc)).toEqual([
      { blockId: OVEN, position: 0, front: 'el horno', back: 'the oven\n' },
    ]);
  });

  test('gives no cards for a doc without them', () => {
    expect(cardsInDoc(docOf(paragraph('hola')))).toEqual([]);
    expect(cardsInDoc(docOf())).toEqual([]);
  });

  test('refuses a doc in which two cards share a block id', () => {
    const doc = docOf(
      cardWithId(KITCHEN, [text('la cocina')]),
      cardWithId(KITCHEN, [text('la nevera')]),
    );

    expect(cardsInDoc(doc)).toBeNull();
  });

  test('refuses a card without a block id, since the index could not find it again', () => {
    expect(cardsInDoc(docOf(cardWithId(null, [text('la cocina')])))).toBeNull();
    expect(cardsInDoc(docOf(card([text('la cocina')])))).toBeNull();
  });

  test('lets another kind of block share a card’s id, since only cards are indexed', () => {
    const doc = docOf(
      { ...paragraph('hola'), attrs: { blockId: KITCHEN } },
      cardWithId(KITCHEN, [text('la cocina')]),
    );

    expect(cardsInDoc(doc)).toHaveLength(1);
  });
});
