import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';

import { Checkbox } from './checkbox';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: { id: 'mix-sets', onCheckedChange: fn() },
  render: (args) => (
    <div className="flex items-center gap-2 text-sm font-medium">
      <Checkbox {...args} />
      <label htmlFor={args.id}>Mix sets</label>
    </div>
  ),
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

const STATES = [
  { id: 'unchecked', label: 'Unchecked', checked: false, disabled: false },
  { id: 'checked', label: 'Checked', checked: true, disabled: false },
  {
    id: 'unchecked-disabled',
    label: 'Unchecked, disabled',
    checked: false,
    disabled: true,
  },
  {
    id: 'checked-disabled',
    label: 'Checked, disabled',
    checked: true,
    disabled: true,
  },
];

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3 text-sm font-medium">
      {STATES.map(({ id, label, checked, disabled }) => (
        <div key={id} className="flex items-center gap-2">
          <Checkbox
            {...args}
            id={id}
            defaultChecked={checked}
            disabled={disabled}
          />
          <label htmlFor={id}>{label}</label>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Checkbox {...args} id="invalid" aria-invalid />
        <label htmlFor="invalid">Invalid</label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox {...args} id="invalid-checked" aria-invalid defaultChecked />
        <label htmlFor="invalid-checked">Invalid, checked</label>
      </div>
    </div>
  ),
};

// Space ticks the box and Enter doesn't, as WAI-ARIA asks; a click on the label ticks it too
export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Mix sets' });

    await userEvent.tab();
    await expect(checkbox).toHaveFocus();

    await userEvent.keyboard(' ');
    await expect(checkbox).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);

    await userEvent.keyboard('{Enter}');
    await expect(checkbox).toBeChecked();

    await userEvent.click(canvas.getByText('Mix sets'));
    await expect(checkbox).not.toBeChecked();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Mix sets' });
    await expect(checkbox).toBeDisabled();

    await userEvent.tab();
    await expect(checkbox).not.toHaveFocus();

    await userEvent.click(checkbox);
    await userEvent.click(canvas.getByText('Mix sets'));
    await expect(checkbox).not.toBeChecked();
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
  },
};
