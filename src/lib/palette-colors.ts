export const PALETTE_COLORS = [
  'violet',
  'blue',
  'amber',
  'green',
  'pink',
  'orange',
  'red',
  'teal',
  'slate',
] as const;

export type PaletteColor = (typeof PALETTE_COLORS)[number];
