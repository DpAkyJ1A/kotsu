import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';

import { Switch } from './switch';

const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: { id: 'favour-weak', onCheckedChange: fn() },
  render: (args) => (
    <div className="flex items-center gap-2 text-sm font-medium">
      <Switch {...args} />
      <label htmlFor={args.id}>Favour weak cards</label>
    </div>
  ),
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

const STATES = [
  { id: 'off', label: 'Off', checked: false, disabled: false },
  { id: 'on', label: 'On', checked: true, disabled: false },
  {
    id: 'off-disabled',
    label: 'Off, disabled',
    checked: false,
    disabled: true,
  },
  { id: 'on-disabled', label: 'On, disabled', checked: true, disabled: true },
];

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3 text-sm font-medium">
      {STATES.map(({ id, label, checked, disabled }) => (
        <div key={id} className="flex items-center gap-2">
          <Switch
            {...args}
            id={id}
            defaultChecked={checked}
            disabled={disabled}
          />
          <label htmlFor={id}>{label}</label>
        </div>
      ))}
    </div>
  ),
};

// Space flips the switch; so does a click on its label
export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole('switch', { name: 'Favour weak cards' });

    await userEvent.tab();
    await expect(toggle).toHaveFocus();

    await userEvent.keyboard(' ');
    await expect(toggle).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);

    await userEvent.keyboard(' ');
    await expect(toggle).not.toBeChecked();

    await userEvent.click(canvas.getByText('Favour weak cards'));
    await expect(toggle).toBeChecked();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole('switch', { name: 'Favour weak cards' });
    await expect(toggle).toBeDisabled();

    await userEvent.tab();
    await expect(toggle).not.toHaveFocus();

    await userEvent.click(toggle);
    await userEvent.click(canvas.getByText('Favour weak cards'));
    await expect(toggle).not.toBeChecked();
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
  },
};
