import { describe, expect, test } from 'vitest';

import {
  hasEditsNotOnTheirWay,
  isIdle,
  openedAt,
  type SaveState,
  statusOf,
} from './save-state';

function stateWith(change: Partial<SaveState>): SaveState {
  return { ...openedAt(1), ...change };
}

describe('statusOf', () => {
  test.each<[string, Partial<SaveState>, ReturnType<typeof statusOf>]>([
    ['a doc just opened', {}, 'saved'],
    ['edits waiting for the pause', { edits: 2 }, 'saving'],
    ['a save on its way', { edits: 2, sendingEdits: 2 }, 'saving'],
    ['everything saved', { edits: 2, savedEdits: 2, version: 2 }, 'saved'],
    ['a save that failed offline', { edits: 1, failure: 'OFFLINE' }, 'offline'],
    ['a body too long to save', { edits: 1, failure: 'TOO_LONG' }, 'tooLong'],
    ['a save the server refused', { edits: 1, failure: 'FAILED' }, 'notSaved'],
    [
      'a conflict waiting for a choice',
      { edits: 1, failure: 'CONFLICT', conflict: 'asking' },
      'notSaved',
    ],
    [
      'a conflict put off',
      { edits: 1, failure: 'CONFLICT', conflict: 'postponed' },
      'notSaved',
    ],
    [
      'a conflict resolved by keeping mine, until the fresh version arrives',
      { edits: 1, failure: 'CONFLICT', conflict: 'keepingMine' },
      'saving',
    ],
    [
      'a conflict resolved by reloading, until the fresh version arrives',
      { edits: 1, failure: 'CONFLICT', conflict: 'reloading' },
      'saving',
    ],
    [
      'a retry on its way after a failure, which keeps saying what failed',
      { edits: 2, sendingEdits: 2, failure: 'OFFLINE' },
      'offline',
    ],
  ])('says %s', (_, change, status) => {
    expect(statusOf(stateWith(change))).toBe(status);
  });
});

describe('isIdle', () => {
  test('is idle only with nothing unsaved, nothing on its way and nothing failed', () => {
    expect(isIdle(stateWith({}))).toBe(true);
    expect(isIdle(stateWith({ edits: 3, savedEdits: 3 }))).toBe(true);
    expect(isIdle(stateWith({ edits: 1 }))).toBe(false);
    expect(isIdle(stateWith({ edits: 1, sendingEdits: 1 }))).toBe(false);
    expect(
      isIdle(stateWith({ edits: 1, savedEdits: 1, failure: 'FAILED' })),
    ).toBe(false);
  });
});

describe('hasEditsNotOnTheirWay', () => {
  test('counts edits made after the save on its way, or after the last saved one', () => {
    expect(
      hasEditsNotOnTheirWay(stateWith({ edits: 2, sendingEdits: 2 })),
    ).toBe(false);
    expect(
      hasEditsNotOnTheirWay(stateWith({ edits: 3, sendingEdits: 2 })),
    ).toBe(true);
    expect(hasEditsNotOnTheirWay(stateWith({ edits: 2, savedEdits: 2 }))).toBe(
      false,
    );
    expect(hasEditsNotOnTheirWay(stateWith({ edits: 2, savedEdits: 1 }))).toBe(
      true,
    );
  });
});
