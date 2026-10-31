import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ReactNode } from 'react';

const THEMES = ['light', 'dark'] as const;

// Full class names, so Tailwind finds them in the source
const SURFACES = [
  { name: 'background', className: 'border bg-background text-foreground' },
  { name: 'card', className: 'bg-card text-card-foreground shadow-md' },
  {
    name: 'popover',
    className: 'bg-popover text-popover-foreground shadow-lg',
  },
  { name: 'primary', className: 'bg-primary text-primary-foreground' },
  { name: 'secondary', className: 'bg-secondary text-secondary-foreground' },
  { name: 'muted', className: 'bg-muted text-muted-foreground' },
  { name: 'accent', className: 'bg-accent text-accent-foreground' },
  { name: 'sidebar', className: 'border bg-sidebar text-sidebar-foreground' },
];

const TEXTS = [
  { name: 'foreground', className: 'text-foreground' },
  { name: 'muted-foreground', className: 'text-muted-foreground' },
  { name: 'sidebar-foreground', className: 'text-sidebar-foreground' },
  { name: 'primary', className: 'text-primary' },
  { name: 'destructive', className: 'text-destructive' },
];

const MARKS = [
  { name: 'border', className: 'border-2 border-border' },
  { name: 'input', className: 'border-2 border-input' },
  { name: 'ring', className: 'border-2 border-ring' },
  { name: 'overlay', className: 'bg-overlay' },
  { name: 'now', className: 'bg-now' },
  { name: 'flame', className: 'bg-flame' },
];

const PALETTE = [
  { name: 'violet', className: 'bg-violet text-violet-foreground' },
  { name: 'blue', className: 'bg-blue text-blue-foreground' },
  { name: 'amber', className: 'bg-amber text-amber-foreground' },
  { name: 'green', className: 'bg-green text-green-foreground' },
  { name: 'pink', className: 'bg-pink text-pink-foreground' },
  { name: 'orange', className: 'bg-orange text-orange-foreground' },
  { name: 'red', className: 'bg-red text-red-foreground' },
  { name: 'teal', className: 'bg-teal text-teal-foreground' },
  { name: 'slate', className: 'bg-slate text-slate-foreground' },
];

const HEAT = [
  { name: '0', className: 'bg-heat-0' },
  { name: '1', className: 'bg-heat-1' },
  { name: '2', className: 'bg-heat-2' },
  { name: '3', className: 'bg-heat-3' },
  { name: '4', className: 'bg-heat-4' },
];

const RADII = [
  { name: 'xs', className: 'rounded-xs' },
  { name: 'sm', className: 'rounded-sm' },
  { name: 'md', className: 'rounded-md' },
  { name: 'lg', className: 'rounded-lg' },
  { name: 'xl', className: 'rounded-xl' },
  { name: '2xl', className: 'rounded-2xl' },
];

const SHADOWS = [
  { name: 'xs', className: 'shadow-xs' },
  { name: 'md', className: 'shadow-md' },
  { name: 'lg', className: 'shadow-lg' },
  { name: 'xl', className: 'shadow-xl' },
];

const WEIGHTS = [
  { name: '400', className: 'font-normal' },
  { name: '500', className: 'font-medium' },
  { name: '600', className: 'font-semibold' },
  { name: '700', className: 'font-bold' },
];

const SAMPLE_TEXT = 'Spanish verbs · 5 cards left';
const SAMPLE_ACCENTS = '¿Qué aprendiste hoy? Mañana, más.';
const SAMPLE_NUMBERS = '09:30–10:45 · 1 111 · 8 888';
const SAMPLE_PAIR = 'Aa';

type Token = { name: string; className: string };

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Swatches({ tokens, sample }: { tokens: Token[]; sample?: string }) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {tokens.map(({ name, className }) => (
        <li key={name} className="flex flex-col gap-1.5">
          <div
            className={`flex h-14 items-center justify-center rounded-lg text-sm font-semibold ${className}`}
          >
            {sample}
          </div>
          <span className="text-xs text-muted-foreground">{name}</span>
        </li>
      ))}
    </ul>
  );
}

// Both themes side by side, each forced with its own data-theme, whatever the toolbar says
function TokenSheet() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {THEMES.map((theme) => (
        <section
          key={theme}
          data-theme={theme}
          aria-labelledby={`${theme}-theme`}
          className="flex flex-col gap-8 rounded-2xl border bg-background p-5 text-foreground sm:p-8"
        >
          <h2 id={`${theme}-theme`} className="text-lg font-semibold">
            {theme}
          </h2>

          <Group title="surfaces">
            <Swatches tokens={SURFACES} sample={SAMPLE_PAIR} />
          </Group>

          <Group title="text">
            <ul className="flex flex-col gap-1">
              {TEXTS.map(({ name, className }) => (
                <li key={name} className={`text-sm font-medium ${className}`}>
                  {name}
                </li>
              ))}
            </ul>
          </Group>

          <Group title="lines and marks">
            <Swatches tokens={MARKS} />
          </Group>

          <Group title="palette">
            <ul className="flex flex-wrap gap-2">
              {PALETTE.map(({ name, className }) => (
                <li
                  key={name}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${className}`}
                >
                  {name}
                </li>
              ))}
            </ul>
          </Group>

          <Group title="heat">
            <ul className="flex gap-2">
              {HEAT.map(({ name, className }) => (
                <li key={name} className="flex flex-col items-center gap-1.5">
                  <div className={`size-7 rounded-xs ${className}`} />
                  <span className="text-xs text-muted-foreground">{name}</span>
                </li>
              ))}
            </ul>
          </Group>

          <Group title="radius">
            <ul className="flex flex-wrap gap-3">
              {RADII.map(({ name, className }) => (
                <li key={name} className="flex flex-col items-center gap-1.5">
                  <div className={`size-12 border-2 bg-muted ${className}`} />
                  <span className="text-xs text-muted-foreground">{name}</span>
                </li>
              ))}
            </ul>
          </Group>

          <Group title="shadow">
            <Swatches
              tokens={SHADOWS.map((shadow) => ({
                ...shadow,
                className: `bg-card ${shadow.className}`,
              }))}
            />
          </Group>

          <Group title="type">
            <ul className="flex flex-col gap-2">
              {WEIGHTS.map(({ name, className }) => (
                <li key={name} className={`flex flex-col ${className}`}>
                  <span className="text-xs font-normal text-muted-foreground">
                    {name}
                  </span>
                  <span className="text-lg">{SAMPLE_TEXT}</span>
                  <span className="text-lg">{SAMPLE_ACCENTS}</span>
                </li>
              ))}
              <li className="text-2xl font-semibold">{SAMPLE_NUMBERS}</li>
            </ul>
          </Group>
        </section>
      ))}
    </div>
  );
}

const meta = {
  title: 'Foundations/Tokens',
  component: TokenSheet,
} satisfies Meta<typeof TokenSheet>;

export default meta;

export const Tokens: StoryObj<typeof meta> = {};
