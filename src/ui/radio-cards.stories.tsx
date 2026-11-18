import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, type UserEventObject } from 'storybook/test';

import { RadioCard, RadioCards } from './radio-cards';

function Picture({ rows }: { rows: number }) {
  return (
    <span className="grid size-full content-start gap-1.5 bg-muted p-3">
      {Array.from({ length: rows }, (_, row) => (
        <span key={row} className="h-2 rounded-full bg-blue" />
      ))}
    </span>
  );
}

const meta = {
  title: 'Components/RadioCards',
  component: RadioCards,
  args: {
    'aria-label': 'Cards per session',
    defaultValue: '10',
    onValueChange: fn(),
    className: 'w-120',
  },
  render: (args) => (
    <RadioCards {...args}>
      <RadioCard value="5" picture={<Picture rows={2} />}>
        5 cards
      </RadioCard>
      <RadioCard value="10" picture={<Picture rows={4} />}>
        10 cards
      </RadioCard>
      <RadioCard value="20" picture={<Picture rows={7} />}>
        20 cards
      </RadioCard>
    </RadioCards>
  ),
} satisfies Meta<typeof RadioCards>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OnAPhone: Story = {
  args: { className: 'w-full' },
  globals: { viewport: { value: 'mobile2' } },
};

const press = (userEvent: UserEventObject, key: string) =>
  userEvent.keyboard(`{${key}>}{/${key}}`);

export const PicksWithAClick: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('20 cards'));

    await expect(canvas.getByRole('radio', { name: '20 cards' })).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('20');
  },
};

export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const card = (name: string) => canvas.getByRole('radio', { name });

    await userEvent.tab();
    await expect(card('10 cards')).toHaveFocus();

    await press(userEvent, 'ArrowRight');
    await expect(card('20 cards')).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('20');

    await press(userEvent, 'ArrowRight');
    await expect(card('5 cards')).toBeChecked();
  },
};
