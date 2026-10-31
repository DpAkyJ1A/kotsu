import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Kbd } from './kbd';

const meta = {
  title: 'Components/Kbd',
  component: Kbd,
  args: { children: '⌘K' },
} satisfies Meta<typeof Kbd>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Keys: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Kbd>⌘K</Kbd>
      <Kbd>⌘\</Kbd>
      <Kbd>⌘Z</Kbd>
      <Kbd>Esc</Kbd>
      <Kbd>Space</Kbd>
      <Kbd>←</Kbd>
      <Kbd>→</Kbd>
      <Kbd>↑</Kbd>
    </div>
  ),
};

export const InText: Story = {
  render: () => (
    <p className="text-sm">
      Press <Kbd>Space</Kbd> to show the answer, <Kbd>→</Kbd> if you got it.
    </p>
  ),
};
