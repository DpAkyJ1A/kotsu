import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';

import { IconButton } from './icon-button';
import { PanelLeftIcon, PlusIcon, XIcon } from './icons';

const VARIANTS = ['ghost', 'secondary', 'primary', 'destructive'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  args: { label: 'Toggle sidebar', children: <PanelLeftIcon />, onClick: fn() },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {VARIANTS.map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          {SIZES.map((size) => (
            <IconButton
              key={size}
              {...args}
              label="New doc"
              variant={variant}
              size={size}
            >
              <PlusIcon />
            </IconButton>
          ))}
          <IconButton {...args} label="Close" variant={variant} disabled>
            <XIcon />
          </IconButton>
        </div>
      ))}
    </div>
  ),
};

// The label is the accessible name; Tab reaches the button, Enter and Space press it
export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.tab();
    await expect(
      canvas.getByRole('button', { name: 'Toggle sidebar' }),
    ).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Toggle sidebar' });
    await expect(button).toBeDisabled();

    await userEvent.tab();
    await expect(button).not.toHaveFocus();
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
