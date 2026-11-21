import { describe, expect, test } from 'vitest';

import { changesPlace, moveOntoShelf, moveOverDoc } from './doc-drag';
import type { Item } from './item';
import { applyItemChange, type ItemMove, itemsOn } from './item-change';

function doc(id: string, shelfId: string): Item {
  return { id, shelfId, kind: 'doc', title: id };
}

const items = [
  doc('verbs', 'spanish'),
  doc('food', 'spanish'),
  doc('travel', 'spanish'),
  doc('chords', 'guitar'),
  doc('scales', 'guitar'),
];

function idsOn(list: readonly Item[], shelfId: string) {
  return itemsOn(list, shelfId).map(({ id }) => id);
}

function applied(move: ItemMove | undefined) {
  if (!move) throw new Error('Expected a move');
  return applyItemChange(items, move);
}

describe('moveOverDoc', () => {
  test.each([
    { overId: 'food', order: ['food', 'verbs', 'travel'] },
    { overId: 'travel', order: ['food', 'travel', 'verbs'] },
  ])(
    'takes the place of $overId when dragged down its own shelf',
    ({ overId, order }) => {
      const move = moveOverDoc(items, { id: 'verbs', overId, isBelow: false });

      expect(idsOn(applied(move), 'spanish')).toEqual(order);
    },
  );

  test.each([
    { overId: 'food', order: ['verbs', 'travel', 'food'] },
    { overId: 'verbs', order: ['travel', 'verbs', 'food'] },
  ])(
    'takes the place of $overId when dragged up its own shelf',
    ({ overId, order }) => {
      const move = moveOverDoc(items, { id: 'travel', overId, isBelow: true });

      expect(idsOn(applied(move), 'spanish')).toEqual(order);
    },
  );

  test.each([
    { isBelow: false, order: ['verbs', 'chords', 'scales'] },
    { isBelow: true, order: ['chords', 'verbs', 'scales'] },
  ])(
    'goes before a doc of another shelf from above it and after it from below (below: $isBelow)',
    ({ isBelow, order }) => {
      const move = moveOverDoc(items, {
        id: 'verbs',
        overId: 'chords',
        isBelow,
      });

      const moved = applied(move);
      expect(idsOn(moved, 'guitar')).toEqual(order);
      expect(idsOn(moved, 'spanish')).toEqual(['food', 'travel']);
    },
  );

  test('goes last on another shelf when dragged below its last doc', () => {
    const move = moveOverDoc(items, {
      id: 'verbs',
      overId: 'scales',
      isBelow: true,
    });

    expect(move).toEqual({
      type: 'move',
      id: 'verbs',
      shelfId: 'guitar',
      after: 'scales',
    });
  });

  test.each([
    ['itself', 'verbs'],
    ['a doc that is gone', 'missing'],
  ])('moves nothing over %s', (_, overId) => {
    expect(
      moveOverDoc(items, { id: 'verbs', overId, isBelow: false }),
    ).toBeUndefined();
  });
});

describe('moveOntoShelf', () => {
  test('puts a doc at the end of another shelf', () => {
    const move = moveOntoShelf(items, { id: 'verbs', shelfId: 'guitar' });

    expect(idsOn(applied(move), 'guitar')).toEqual([
      'chords',
      'scales',
      'verbs',
    ]);
  });

  test('puts a doc on an empty shelf', () => {
    expect(moveOntoShelf(items, { id: 'verbs', shelfId: 'running' })).toEqual({
      type: 'move',
      id: 'verbs',
      shelfId: 'running',
      after: undefined,
    });
  });

  test('leaves a doc where it is when dropped on its own shelf', () => {
    expect(
      moveOntoShelf(items, { id: 'food', shelfId: 'spanish' }),
    ).toBeUndefined();
  });
});

describe('changesPlace', () => {
  test.each([
    { after: undefined, shelfId: 'spanish', changes: false },
    { after: 'food', shelfId: 'spanish', changes: true },
    { after: undefined, shelfId: 'guitar', changes: true },
  ])(
    'says whether putting Verbs after $after on $shelfId changes anything',
    ({ after, shelfId, changes }) => {
      expect(
        changesPlace(items, { type: 'move', id: 'verbs', shelfId, after }),
      ).toBe(changes);
    },
  );

  test('sees no change for a doc put back after the one before it', () => {
    expect(
      changesPlace(items, {
        type: 'move',
        id: 'travel',
        shelfId: 'spanish',
        after: 'food',
      }),
    ).toBe(false);
  });
});
