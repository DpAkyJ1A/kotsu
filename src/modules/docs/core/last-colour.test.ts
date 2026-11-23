import { describe, expect, test } from 'vitest';

import { FIRST_LAST_COLOUR, lastColourOf, withPick } from './last-colour';

describe('lastColourOf', () => {
  test('is red text before the first pick', () => {
    expect(lastColourOf(null)).toEqual({ text: 'red' });
    expect(FIRST_LAST_COLOUR).toEqual({ text: 'red' });
  });

  test.each([
    ['a text colour', { text: 'blue' }],
    ['a background', { background: 'yellow' }],
    ['both', { text: 'blue', background: 'yellow' }],
  ])('reads %s stored on this device', (_, colour) => {
    expect(lastColourOf(JSON.stringify(colour))).toEqual(colour);
  });

  test('keeps only the text and the background of what is stored', () => {
    expect(
      lastColourOf(JSON.stringify({ text: 'blue', size: 'huge' })),
    ).toEqual({ text: 'blue' });
  });

  test.each([
    ['text that is not JSON', '{text'],
    ['a colour outside the palette', JSON.stringify({ text: 'teal' })],
    ['a hex colour', JSON.stringify({ text: '#ff0000' })],
    ['neither a text colour nor a background', JSON.stringify({})],
    ['a list', JSON.stringify(['red'])],
    ['null', 'null'],
  ])('falls back to red text for %s', (_, stored) => {
    expect(lastColourOf(stored)).toEqual(FIRST_LAST_COLOUR);
  });
});

describe('withPick', () => {
  test('adds a background to the text colour picked before it, so both are the last colour', () => {
    expect(
      withPick({ text: 'blue' }, { row: 'background', colour: 'yellow' }),
    ).toEqual({ text: 'blue', background: 'yellow' });
  });

  test('replaces the colour picked before in the same row', () => {
    expect(
      withPick(
        { text: 'blue', background: 'yellow' },
        { row: 'text', colour: 'red' },
      ),
    ).toEqual({ text: 'red', background: 'yellow' });
  });

  test('starts from nothing picked', () => {
    expect(withPick({}, { row: 'text', colour: 'green' })).toEqual({
      text: 'green',
    });
  });
});
