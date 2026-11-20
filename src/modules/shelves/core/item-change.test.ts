import { describe, expect, test } from 'vitest';

import type { Item } from './item';
import { applyItemChange, itemsOn } from './item-change';

const verbs: Item = {
  id: 'verbs',
  shelfId: 'spanish',
  kind: 'doc',
  title: 'Verbs',
};
const food: Item = {
  id: 'food',
  shelfId: 'spanish',
  kind: 'doc',
  title: 'Kitchen & food',
};
const travel: Item = {
  id: 'travel',
  shelfId: 'spanish',
  kind: 'doc',
  title: 'Travel phrases',
};
const chords: Item = {
  id: 'chords',
  shelfId: 'guitar',
  kind: 'doc',
  title: 'Chords',
};
const scales: Item = {
  id: 'scales',
  shelfId: 'guitar',
  kind: 'doc',
  title: 'Scales',
};
const items = [chords, verbs, food, travel];

function titlesOn(list: readonly Item[], shelfId: string) {
  return itemsOn(list, shelfId).map(({ title }) => title);
}

describe('applyItemChange', () => {
  test('renames only the item it names', () => {
    expect(
      applyItemChange(items, { type: 'rename', id: 'food', title: 'Food' }),
    ).toEqual([chords, verbs, { ...food, title: 'Food' }, travel]);
  });

  test.each([
    { after: 'food', titles: ['Kitchen & food', 'Verbs', 'Travel phrases'] },
    { after: 'travel', titles: ['Kitchen & food', 'Travel phrases', 'Verbs'] },
    { after: undefined, titles: ['Verbs', 'Kitchen & food', 'Travel phrases'] },
  ])('moves Verbs after $after on its own shelf', ({ after, titles }) => {
    const changed = applyItemChange(items, {
      type: 'move',
      id: 'verbs',
      shelfId: 'spanish',
      after,
    });

    expect(titlesOn(changed, 'spanish')).toEqual(titles);
  });

  test('moves an item first on its shelf when it goes after nothing', () => {
    const changed = applyItemChange(items, {
      type: 'move',
      id: 'travel',
      shelfId: 'spanish',
      after: undefined,
    });

    expect(titlesOn(changed, 'spanish')).toEqual([
      'Travel phrases',
      'Verbs',
      'Kitchen & food',
    ]);
  });

  test('moves an item to another shelf, after the item it names there', () => {
    const changed = applyItemChange(items, {
      type: 'move',
      id: 'food',
      shelfId: 'guitar',
      after: 'chords',
    });

    expect(titlesOn(changed, 'guitar')).toEqual(['Chords', 'Kitchen & food']);
    expect(titlesOn(changed, 'spanish')).toEqual(['Verbs', 'Travel phrases']);
  });

  test('moves an item first on another shelf that has items', () => {
    const changed = applyItemChange(items, {
      type: 'move',
      id: 'food',
      shelfId: 'guitar',
      after: undefined,
    });

    expect(titlesOn(changed, 'guitar')).toEqual(['Kitchen & food', 'Chords']);
  });

  test('moves an item onto an empty shelf', () => {
    const changed = applyItemChange(items, {
      type: 'move',
      id: 'chords',
      shelfId: 'running',
      after: undefined,
    });

    expect(titlesOn(changed, 'running')).toEqual(['Chords']);
    expect(titlesOn(changed, 'guitar')).toEqual([]);
  });

  test.each([
    { after: 'gone', what: 'an item that is gone' },
    { after: 'verbs', what: 'an item on another shelf' },
  ])('puts an item moved after $what at the end of its shelf', ({ after }) => {
    const changed = applyItemChange([chords, verbs, scales, food], {
      type: 'move',
      id: 'food',
      shelfId: 'guitar',
      after,
    });

    expect(titlesOn(changed, 'guitar')).toEqual([
      'Chords',
      'Scales',
      'Kitchen & food',
    ]);
  });

  test('leaves the list as it is when the moved item is gone', () => {
    expect(
      applyItemChange(items, {
        type: 'move',
        id: 'gone',
        shelfId: 'guitar',
        after: 'chords',
      }),
    ).toEqual(items);
  });

  test('takes a deleted item out and keeps the others in order', () => {
    expect(applyItemChange(items, { type: 'delete', id: 'food' })).toEqual([
      chords,
      verbs,
      travel,
    ]);
  });

  test('never changes the list it was given', () => {
    const frozen = Object.freeze([...items]);

    applyItemChange(frozen, {
      type: 'move',
      id: 'food',
      shelfId: 'guitar',
      after: undefined,
    });
    applyItemChange(frozen, { type: 'rename', id: 'verbs', title: 'Verbos' });
    applyItemChange(frozen, { type: 'delete', id: 'chords' });

    expect(frozen).toEqual(items);
  });
});

describe('itemsOn', () => {
  test("keeps one shelf's items in their order", () => {
    expect(itemsOn(items, 'spanish')).toEqual([verbs, food, travel]);
  });

  test('finds nothing on a shelf without items', () => {
    expect(itemsOn(items, 'running')).toEqual([]);
  });
});
