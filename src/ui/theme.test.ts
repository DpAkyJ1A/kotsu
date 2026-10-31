import { readFileSync } from 'node:fs';

import { describe, expect, test } from 'vitest';

const css = readFileSync(new URL('theme.css', import.meta.url), 'utf8');

// The raw tokens: `--name: light-dark(light, dark)` or `--name: var(--other)`
const block = /:root,\s*\[data-theme\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
const tokens = new Map(
  [...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
    name ?? '',
    value ?? '',
  ]),
);

type Scheme = 'light' | 'dark';
type Rgba = [r: number, g: number, b: number, a: number];

function resolve(name: string, scheme: Scheme): string {
  const value = tokens.get(name);
  if (value === undefined) throw new Error(`No token --${name}`);
  const alias = /^var\(--([\w-]+)\)$/.exec(value)?.[1];
  if (alias) return resolve(alias, scheme);
  const pair = /^light-dark\(([^,]+),([^,]+)\)$/.exec(value);
  if (!pair) throw new Error(`--${name} is neither light-dark() nor an alias`);
  return (scheme === 'light' ? pair[1] : pair[2])?.trim() ?? '';
}

function parse(color: string): Rgba {
  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (hex) {
    const [, r = '', g = '', b = ''] = hex;
    return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16), 1];
  }
  const rgb = /^rgb\((\d+) (\d+) (\d+) \/ (\d+)%\)$/.exec(color);
  if (rgb) {
    const [, r = '', g = '', b = '', a = ''] = rgb;
    return [Number(r), Number(g), Number(b), Number(a) / 100];
  }
  throw new Error(`Unknown colour format: ${color}`);
}

// A translucent colour as it shows on an opaque backdrop
function over([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1];
}

// WCAG 2 relative luminance and contrast ratio
function luminance([r, g, b]: Rgba) {
  const [lr = 0, lg = 0, lb = 0] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrast(text: Rgba, surface: Rgba) {
  const [light, dark] = [luminance(text), luminance(surface)].sort(
    (a, b) => b - a,
  );
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

const PALETTE = [
  'violet',
  'blue',
  'amber',
  'green',
  'pink',
  'orange',
  'red',
  'teal',
  'slate',
];

// Text tokens on the surfaces they are used on; `backdrop` is under a translucent surface
const PAIRS = [
  { text: 'foreground', surface: 'background' },
  { text: 'card-foreground', surface: 'card' },
  { text: 'popover-foreground', surface: 'popover' },
  { text: 'secondary-foreground', surface: 'secondary' },
  { text: 'accent-foreground', surface: 'accent' },
  { text: 'muted-foreground', surface: 'background' },
  { text: 'muted-foreground', surface: 'card' },
  { text: 'muted-foreground', surface: 'muted' },
  { text: 'muted-foreground', surface: 'accent' },
  { text: 'muted-foreground', surface: 'sidebar' },
  { text: 'sidebar-foreground', surface: 'sidebar' },
  {
    text: 'sidebar-accent-foreground',
    surface: 'sidebar-accent',
    backdrop: 'sidebar',
  },
  { text: 'primary-foreground', surface: 'primary' },
  { text: 'primary', surface: 'background' },
  { text: 'destructive', surface: 'background' },
  ...PALETTE.map((color) => ({ text: `${color}-foreground`, surface: color })),
];

// Surfaces a form control can sit on, for its `input` edge
const CONTROL_SURFACES = ['background', 'card', 'popover', 'sidebar', 'muted'];

test('every token has a light and a dark value', () => {
  expect(tokens.size).toBeGreaterThan(0);
  for (const name of tokens.keys()) {
    expect(() => resolve(name, 'light')).not.toThrow();
  }
});

describe.for<Scheme>(['light', 'dark'])('%s theme', (scheme) => {
  test.for(PAIRS)(
    '$text on $surface passes WCAG AA',
    ({ text, surface, backdrop = 'background' }) => {
      const base = parse(resolve(backdrop, scheme));
      const ratio = contrast(
        parse(resolve(text, scheme)),
        over(parse(resolve(surface, scheme)), base),
      );

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );

  test.for(CONTROL_SURFACES)(
    'the input edge on %s passes WCAG 1.4.11',
    (surface) => {
      const backdrop = over(
        parse(resolve(surface, scheme)),
        parse(resolve('background', scheme)),
      );
      const ratio = contrast(
        over(parse(resolve('input', scheme)), backdrop),
        backdrop,
      );

      expect(ratio).toBeGreaterThanOrEqual(3);
    },
  );
});
