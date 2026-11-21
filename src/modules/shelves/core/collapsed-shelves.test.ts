import { describe, expect, test } from 'vitest';

import {
  COLLAPSED_SHELVES_COOKIE,
  collapsedShelvesCookie,
  collapsedShelvesFrom,
} from './collapsed-shelves';

const SPANISH = '019a9c3e-0001-7000-8000-000000000001';
const GUITAR = '019a9c3e-0002-7000-8000-000000000002';

const SHELVES = [{ id: SPANISH }, { id: GUITAR }];

function written(shelves: readonly { id: string }[], collapsed: string[]) {
  const [pair = ''] = collapsedShelvesCookie(shelves, new Set(collapsed)).split(
    ';',
  );
  const [name, value] = pair.split('=');
  return { name, value };
}

describe('collapsed shelves cookie', () => {
  test.each([[[SPANISH, GUITAR]], [[GUITAR]], [[]]])(
    'reads back the shelves it wrote: %j',
    (shelfIds) => {
      const { name, value } = written(SHELVES, shelfIds);

      expect(name).toBe(COLLAPSED_SHELVES_COOKIE);
      expect(collapsedShelvesFrom(value)).toEqual(shelfIds);
    },
  );

  test('keeps every shelf open without the cookie', () => {
    expect(collapsedShelvesFrom(undefined)).toEqual([]);
  });

  test('writes the folded shelves in shelf order and leaves out the ones that are gone', () => {
    const { value } = written([{ id: GUITAR }], [SPANISH, GUITAR]);

    expect(collapsedShelvesFrom(value)).toEqual([GUITAR]);
  });

  test('keeps the choice for a year on every page, with no character a cookie forbids', () => {
    expect(collapsedShelvesCookie(SHELVES, new Set([GUITAR, SPANISH]))).toBe(
      `collapsed-shelves=${SPANISH}.${GUITAR}; path=/; max-age=31536000; samesite=lax`,
    );
  });
});
