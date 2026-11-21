import { describe, expect, test } from 'vitest';

import { idBefore } from './id-before';

const list = [{ id: 'spanish' }, { id: 'guitar' }, { id: 'running' }];

describe('idBefore', () => {
  test.each([
    { id: 'running', index: 0, before: undefined },
    { id: 'running', index: 1, before: 'spanish' },
    { id: 'spanish', index: 1, before: 'guitar' },
    { id: 'spanish', index: 2, before: 'running' },
    { id: 'guitar', index: 1, before: 'spanish' },
  ])('finds $before above $id dropped at $index', ({ id, index, before }) => {
    expect(idBefore(list, id, index)).toBe(before);
  });
});
