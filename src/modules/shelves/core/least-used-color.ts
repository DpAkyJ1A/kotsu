import { PALETTE_COLORS, type PaletteColor } from '@/lib/palette-colors';

export function leastUsedColor(used: readonly PaletteColor[]): PaletteColor {
  const uses = (color: PaletteColor) =>
    used.filter((usedColor) => usedColor === color).length;
  return PALETTE_COLORS.reduce((least, color) =>
    uses(color) < uses(least) ? color : least,
  );
}
