import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Chip } from './chip';

const COLORS = [
  'neutral',
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

const meta = {
  title: 'Components/Chip',
  component: Chip,
  args: { children: 'Review' },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Colors: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => (
        <Chip key={color} {...args} color={color}>
          {color}
        </Chip>
      ))}
    </div>
  ),
};

// A card's status, as in the docs and Practice mockups
export const CardStatus: Story = {
  render: (args) => (
    <div className="flex gap-2">
      <Chip {...args}>New</Chip>
      <Chip {...args} color="amber">
        Review
      </Chip>
      <Chip {...args} color="green">
        Got it
      </Chip>
    </div>
  ),
};
