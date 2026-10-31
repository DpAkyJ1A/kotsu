import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';

import { Button } from './button';
import { PlayIcon } from './icons';

const VARIANTS = ['primary', 'secondary', 'ghost', 'destructive'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Start practice', onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {VARIANTS.map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          {SIZES.map((size) => (
            <Button key={size} {...args} variant={variant} size={size}>
              <PlayIcon />
              Start practice
            </Button>
          ))}
          <Button {...args} variant={variant}>
            No icon
          </Button>
          <Button {...args} variant={variant} disabled>
            Disabled
          </Button>
        </div>
      ))}
    </div>
  ),
};

// Tab reaches the button, Enter and Space press it
export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button')).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

// Tab skips a disabled button, so the keyboard can't press it
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button');
    await expect(button).toBeDisabled();

    await userEvent.tab();
    await expect(button).not.toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

// asChild gives the look to a link, which stays a link for the keyboard and screen readers
export const AsLink: Story = {
  render: (args) => (
    <Button {...args} asChild variant="secondary">
      <a href="#spanish-verbs">Open Spanish verbs</a>
    </Button>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: 'Open Spanish verbs' }),
    ).toHaveAttribute('data-slot', 'button');
  },
};
