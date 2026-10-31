import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';

import { Textarea } from './textarea';

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  args: { placeholder: 'What did you practise today?' },
  render: (args) => (
    <label className="flex max-w-sm flex-col gap-1.5 text-sm font-medium">
      Day note
      <Textarea {...args} />
    </label>
  ),
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const States: Story = {
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-5 text-sm font-medium">
      <label className="flex flex-col gap-1.5">
        Empty
        <Textarea {...args} />
      </label>
      <label className="flex flex-col gap-1.5">
        Filled
        <Textarea
          {...args}
          defaultValue={
            'Ten Spanish verbs in the past tense.\nScales in G major, slow, then at 80 bpm.\nA short run before dinner.'
          }
        />
      </label>
      <label className="flex flex-col gap-1.5">
        Invalid
        <Textarea {...args} aria-invalid />
      </label>
      <label className="flex flex-col gap-1.5">
        Disabled
        <Textarea {...args} defaultValue="Scales in G major" disabled />
      </label>
    </div>
  ),
};

// Enter starts a new line and the field grows with the text instead of scrolling
export const Keyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Day note' });
    const emptyHeight = textarea.offsetHeight;

    await userEvent.tab();
    await expect(textarea).toHaveFocus();

    await userEvent.keyboard('Verbs{Enter}Scales{Enter}A run{Enter}Chords');
    await expect(textarea).toHaveValue('Verbs\nScales\nA run\nChords');
    await expect(textarea.offsetHeight).toBeGreaterThan(emptyHeight);
    await expect(textarea.scrollHeight).toBe(textarea.clientHeight);
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas, userEvent }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Day note' });
    await expect(textarea).toBeDisabled();

    await userEvent.tab();
    await expect(textarea).not.toHaveFocus();

    await userEvent.click(textarea);
    await userEvent.keyboard('Verbs');
    await expect(textarea).toHaveValue('');
  },
};
