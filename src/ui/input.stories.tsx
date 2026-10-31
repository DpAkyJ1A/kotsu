import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';

import { Input } from './input';

const meta = {
  title: 'Components/Input',
  component: Input,
  args: { placeholder: 'e.g. Spanish verbs' },
  render: (args) => (
    <label className="flex max-w-xs flex-col gap-1.5 text-sm font-medium">
      Doc name
      <Input {...args} />
    </label>
  ),
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const States: Story = {
  render: (args) => (
    <div className="flex max-w-xs flex-col gap-5 text-sm font-medium">
      <label className="flex flex-col gap-1.5">
        Empty
        <Input {...args} />
      </label>
      <label className="flex flex-col gap-1.5">
        Filled
        <Input {...args} defaultValue="Spanish verbs" />
      </label>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="invalid-name">Invalid</label>
        <Input
          {...args}
          id="invalid-name"
          aria-invalid
          aria-describedby="invalid-name-error"
        />
        <p id="invalid-name-error" className="text-destructive">
          Give the doc a name
        </p>
      </div>
      <label className="flex flex-col gap-1.5">
        Disabled
        <Input {...args} defaultValue="Spanish verbs" disabled />
      </label>
    </div>
  ),
};

// Tab reaches the field and typing fills it
export const Keyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Doc name' });

    await userEvent.tab();
    await expect(input).toHaveFocus();

    await userEvent.keyboard('Spanish verbs');
    await expect(input).toHaveValue('Spanish verbs');
  },
};

// Tab skips a disabled field, and a click doesn't let you type into it
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Doc name' });
    await expect(input).toBeDisabled();

    await userEvent.tab();
    await expect(input).not.toHaveFocus();

    await userEvent.click(input);
    await userEvent.keyboard('Spanish verbs');
    await expect(input).toHaveValue('');
  },
};
