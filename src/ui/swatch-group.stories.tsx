import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { cn } from 'cn';
import { useState } from 'react';
import { expect, fn } from 'storybook/test';

import { Swatch, SwatchGroup } from './swatch-group';

const FILLS = [
  { value: 'none', name: 'None', fill: 'bg-background' },
  { value: 'amber', name: 'Amber', fill: 'bg-amber' },
  { value: 'green', name: 'Green', fill: 'bg-green' },
  { value: 'blue', name: 'Blue', fill: 'bg-blue' },
];

type HighlightProps = { onPick: (value: string) => void };

function Highlight({ onPick }: HighlightProps) {
  const [value, setValue] = useState('amber');

  return (
    <div className="flex flex-col gap-2 text-sm">
      <p id="highlight" className="font-semibold">
        Highlight
      </p>
      <SwatchGroup
        aria-labelledby="highlight"
        value={value}
        onValueChange={(picked) => {
          if (picked === '') return;
          setValue(picked);
          onPick(picked);
        }}
      >
        {FILLS.map(({ value: fillValue, name, fill }) => (
          <Swatch key={fillValue} value={fillValue} aria-label={name}>
            <span className={cn('size-full rounded-sm border', fill)} />
          </Swatch>
        ))}
      </SwatchGroup>
    </div>
  );
}

const meta = {
  title: 'Components/SwatchGroup',
  component: Highlight,
  args: { onPick: fn() },
} satisfies Meta<typeof Highlight>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ArrowsMoveTheFocusAndEnterPicks: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const swatch = (name: string) => canvas.getByRole('radio', { name });

    await userEvent.tab();
    await expect(swatch('Amber')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(swatch('Green')).toHaveFocus();
    await expect(swatch('Amber')).toHaveAttribute('aria-checked', 'true');
    await expect(args.onPick).not.toHaveBeenCalled();

    await userEvent.keyboard('{Enter}');

    await expect(swatch('Green')).toHaveAttribute('aria-checked', 'true');
    await expect(swatch('Amber')).toHaveAttribute('aria-checked', 'false');
    await expect(args.onPick).toHaveBeenCalledWith('green');
  },
};

export const AClickOnThePickedSwatchKeepsIt: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const amber = canvas.getByRole('radio', { name: 'Amber' });

    await userEvent.click(amber);

    await expect(amber).toHaveAttribute('aria-checked', 'true');
    await expect(args.onPick).not.toHaveBeenCalled();
  },
};

export const ArrowsGoRoundFromEndToEnd: Story = {
  play: async ({ canvas, userEvent }) => {
    const swatch = (name: string) => canvas.getByRole('radio', { name });

    await userEvent.tab();
    await userEvent.keyboard('{End}');
    await expect(swatch('Blue')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(swatch('None')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(swatch('Blue')).toHaveFocus();
  },
};
