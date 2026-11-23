export const COLOURS = [
  'gray',
  'brown',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'red',
] as const;

export type Colour = (typeof COLOURS)[number];

export type ColourRow = 'text' | 'background';

export const INK: Record<Colour, string> = {
  gray: 'text-ink-gray',
  brown: 'text-ink-brown',
  orange: 'text-ink-orange',
  yellow: 'text-ink-yellow',
  green: 'text-ink-green',
  blue: 'text-ink-blue',
  purple: 'text-ink-purple',
  pink: 'text-ink-pink',
  red: 'text-ink-red',
};

export const MARKER: Record<Colour, string> = {
  gray: 'bg-marker-gray',
  brown: 'bg-marker-brown',
  orange: 'bg-marker-orange',
  yellow: 'bg-marker-yellow',
  green: 'bg-marker-green',
  blue: 'bg-marker-blue',
  purple: 'bg-marker-purple',
  pink: 'bg-marker-pink',
  red: 'bg-marker-red',
};

export function isColour(value: unknown): value is Colour {
  return COLOURS.some((colour) => colour === value);
}
