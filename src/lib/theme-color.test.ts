import { describe, expect, test } from 'vitest';

import { BACKGROUND, themeColors } from './theme-color';

const LIGHT_SYSTEM = '(prefers-color-scheme: light)';
const DARK_SYSTEM = '(prefers-color-scheme: dark)';

describe('themeColors', () => {
  test('follows the system with the auto theme', () => {
    expect(themeColors('system')).toEqual([
      { media: LIGHT_SYSTEM, color: BACKGROUND.light },
      { media: DARK_SYSTEM, color: BACKGROUND.dark },
    ]);
  });

  test.each(['light', 'dark'] as const)(
    'keeps the %s colour whatever the system',
    (theme) => {
      expect(themeColors(theme)).toEqual([
        { media: LIGHT_SYSTEM, color: BACKGROUND[theme] },
        { media: DARK_SYSTEM, color: BACKGROUND[theme] },
      ]);
    },
  );
});
