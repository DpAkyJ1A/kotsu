import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, type UserEventObject } from 'storybook/test';

import { ContrastIcon, MoonIcon, SunIcon } from './icons';
import { SegmentedControl, SegmentedControlItem } from './segmented-control';

const meta = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  args: {
    'aria-label': 'Calendar view',
    defaultValue: 'week',
    onValueChange: fn(),
  },
  render: (args) => (
    <SegmentedControl {...args}>
      <SegmentedControlItem value="day">Day</SegmentedControlItem>
      <SegmentedControlItem value="week">Week</SegmentedControlItem>
      <SegmentedControlItem value="month">Month</SegmentedControlItem>
      <SegmentedControlItem value="year">Year</SegmentedControlItem>
    </SegmentedControl>
  ),
} satisfies Meta<typeof SegmentedControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcons: Story = {
  args: { 'aria-label': 'Theme', defaultValue: 'auto' },
  render: (args) => (
    <SegmentedControl {...args}>
      <SegmentedControlItem value="light">
        <SunIcon />
        Light
      </SegmentedControlItem>
      <SegmentedControlItem value="dark">
        <MoonIcon />
        Dark
      </SegmentedControlItem>
      <SegmentedControlItem value="auto">
        <ContrastIcon />
        Auto
      </SegmentedControlItem>
    </SegmentedControl>
  ),
};

// Stretched to its container, as on a phone: the segments share the width
export const FullWidth: Story = {
  args: { className: 'w-full' },
};

// Radix picks the segment that the focus moves to only while an arrow key is down. A real key stays down for
// a moment; user-event would release it before the focus moves, so the key is held and released in two steps
const press = (userEvent: UserEventObject, key: string) =>
  userEvent.keyboard(`{${key}>}{/${key}}`);

// Tab lands on the picked segment; arrows move the pick and wrap around at the ends
export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const segment = (name: string) => canvas.getByRole('radio', { name });

    await userEvent.tab();
    await expect(segment('Week')).toHaveFocus();

    await press(userEvent, 'ArrowRight');
    await expect(segment('Month')).toBeChecked();
    await expect(segment('Month')).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('month');

    await press(userEvent, 'ArrowRight');
    await press(userEvent, 'ArrowRight');
    await expect(segment('Day')).toBeChecked();

    await press(userEvent, 'ArrowLeft');
    await expect(segment('Year')).toBeChecked();
  },
};

// Arrows skip a disabled segment; a disabled control can't be reached at all
export const Disabled: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      <SegmentedControl {...args}>
        <SegmentedControlItem value="day">Day</SegmentedControlItem>
        <SegmentedControlItem value="week">Week</SegmentedControlItem>
        <SegmentedControlItem value="month" disabled>
          Month
        </SegmentedControlItem>
        <SegmentedControlItem value="year">Year</SegmentedControlItem>
      </SegmentedControl>
      <SegmentedControl
        {...args}
        aria-label="Theme"
        defaultValue="dark"
        disabled
      >
        <SegmentedControlItem value="light">Light</SegmentedControlItem>
        <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
      </SegmentedControl>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const segment = (name: string) => canvas.getByRole('radio', { name });

    await userEvent.tab();
    await press(userEvent, 'ArrowRight');
    await expect(segment('Year')).toBeChecked();
    await expect(segment('Month')).not.toBeChecked();

    await userEvent.tab();
    await expect(document.body).toHaveFocus();
    await expect(segment('Light')).toBeDisabled();
    await expect(segment('Dark')).toBeDisabled();
  },
};
