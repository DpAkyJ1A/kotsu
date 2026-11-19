import { describe, expect, test } from 'vitest';

import { PALETTE_COLORS } from '@/lib/palette-colors';

import { leastUsedColor } from './least-used-color';

describe('leastUsedColor', () => {
  test('starts with the first colour of the palette', () => {
    expect(leastUsedColor([])).toBe('violet');
  });

  test('takes the next colour nobody uses yet, in palette order', () => {
    expect(leastUsedColor(['violet', 'amber'])).toBe('blue');
  });

  test('starts the palette again once every colour is used', () => {
    expect(leastUsedColor(PALETTE_COLORS)).toBe('violet');
  });

  test('takes the colour used least, wherever it sits in the palette', () => {
    const everyColorTwiceButTeal = [
      ...PALETTE_COLORS,
      ...PALETTE_COLORS.filter((color) => color !== 'teal'),
    ];

    expect(leastUsedColor(everyColorTwiceButTeal)).toBe('teal');
  });
});
