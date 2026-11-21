import { describe, expect, test } from 'vitest';

import type { Shelf } from './shelf';
import { applyShelfChange } from './shelf-change';

const spanish: Shelf = { id: 'spanish', name: 'Spanish', color: 'violet' };
const guitar: Shelf = { id: 'guitar', name: 'Guitar', color: 'blue' };
const running: Shelf = { id: 'running', name: 'Running', color: 'amber' };
const shelves = [spanish, guitar, running];

function namesOf(list: readonly Shelf[]) {
  return list.map(({ name }) => name);
}

describe('applyShelfChange', () => {
  test('adds a created shelf at the end, as the server does', () => {
    const chess: Shelf = { id: 'chess', name: 'Chess', color: 'green' };

    expect(applyShelfChange(shelves, { type: 'create', shelf: chess })).toEqual(
      [spanish, guitar, running, chess],
    );
  });

  test('changes only what the patch names, only on that shelf', () => {
    expect(
      applyShelfChange(shelves, {
        type: 'update',
        id: 'guitar',
        patch: { color: 'teal' },
      }),
    ).toEqual([spanish, { ...guitar, color: 'teal' }, running]);
  });

  test.each([
    { after: 'guitar', names: ['Guitar', 'Spanish', 'Running'] },
    { after: 'running', names: ['Guitar', 'Running', 'Spanish'] },
    { after: undefined, names: ['Spanish', 'Guitar', 'Running'] },
  ])('moves Spanish after $after', ({ after, names }) => {
    expect(
      namesOf(
        applyShelfChange(shelves, { type: 'move', id: 'spanish', after }),
      ),
    ).toEqual(names);
  });

  test('moves a shelf first when it goes after nothing', () => {
    expect(
      namesOf(
        applyShelfChange(shelves, {
          type: 'move',
          id: 'running',
          after: undefined,
        }),
      ),
    ).toEqual(['Running', 'Spanish', 'Guitar']);
  });

  test('leaves the list as it is when the moved shelf is gone', () => {
    expect(
      applyShelfChange(shelves, { type: 'move', id: 'chess', after: 'guitar' }),
    ).toEqual(shelves);
  });

  test('takes a deleted shelf out and keeps the others in order', () => {
    expect(applyShelfChange(shelves, { type: 'delete', id: 'guitar' })).toEqual(
      [spanish, running],
    );
  });

  test('never changes the list it was given', () => {
    const frozen = Object.freeze([...shelves]);

    applyShelfChange(frozen, { type: 'move', id: 'running', after: undefined });
    applyShelfChange(frozen, { type: 'delete', id: 'spanish' });

    expect(frozen).toEqual(shelves);
  });
});
