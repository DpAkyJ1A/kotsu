import { describe, expect, test } from 'vitest';

import { displayName } from './account';

describe('displayName', () => {
  test('is the name the user gave', () => {
    expect(
      displayName({ name: 'Ada Lovelace', email: 'ada@example.com' }),
    ).toBe('Ada Lovelace');
  });

  test.each([
    ['no name yet', ''],
    ['a name of spaces', '  '],
  ])('falls back to the email before the @ for %s', (_, name) => {
    expect(displayName({ name, email: 'ada.l@example.com' })).toBe('ada.l');
  });
});
