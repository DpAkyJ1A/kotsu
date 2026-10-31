import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen } from 'storybook/test';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';

const meta = {
  title: 'Components/Select',
  component: Select,
  render: (args) => (
    <div className="flex max-w-xs flex-col gap-1.5 text-sm font-medium">
      <label htmlFor="week-start">Week starts on</label>
      <Select {...args}>
        <SelectTrigger id="week-start" className="w-40">
          <SelectValue placeholder="Pick a day" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="monday">Monday</SelectItem>
          <SelectItem value="saturday" disabled>
            Saturday
          </SelectItem>
          <SelectItem value="sunday">Sunday</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {};

export const Picked: Story = {
  args: { defaultValue: 'monday' },
};

// Open, with groups, a separator, a disabled item and the list placed below the trigger
export const Groups: Story = {
  args: { defaultOpen: true, defaultValue: 'verbs' },
  parameters: {
    a11y: {
      config: {
        // While the list is open Radix hides the rest of the page from screen readers and keeps the focus in
        // the list, so the trigger can't be reached; axe only sees a focusable button under aria-hidden
        rules: [{ id: 'aria-hidden-focus', enabled: false }],
      },
    },
  },
  render: (args) => (
    <div className="flex h-96 max-w-xs flex-col gap-1.5 text-sm font-medium">
      <label htmlFor="practice-set">Practice set</label>
      <Select {...args}>
        <SelectTrigger id="practice-set" className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectGroup>
            <SelectLabel>Spanish</SelectLabel>
            <SelectItem value="verbs">Spanish verbs</SelectItem>
            <SelectItem value="words">Spanish words</SelectItem>
            <SelectItem value="phrases" disabled>
              Phrases (no cards yet)
            </SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Guitar</SelectLabel>
            <SelectItem value="chords">Chords</SelectItem>
            <SelectItem value="scales">Scales</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'monday' },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Week starts on' });
    await expect(trigger).toBeDisabled();

    await userEvent.tab();
    await expect(trigger).not.toHaveFocus();

    await userEvent.click(trigger);
    await expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  },
};

// Enter opens the list, arrows move past the disabled item, Tab can't leave the open list, Enter picks and
// gives focus back to the trigger; Escape closes without changing the pick
export const Keyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Week starts on' });

    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(
      await screen.findByRole('option', { name: 'Monday' }),
    ).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await expect(screen.getByRole('option', { name: 'Sunday' })).toHaveFocus();

    await userEvent.tab();
    await expect(screen.getByRole('option', { name: 'Sunday' })).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(trigger).toHaveTextContent('Sunday');
    await expect(trigger).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await expect(
      await screen.findByRole('option', { name: 'Sunday' }),
    ).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}{Escape}');
    await expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(trigger).toHaveTextContent('Sunday');
  },
};
