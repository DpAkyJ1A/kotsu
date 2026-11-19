import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, mocked, waitFor } from 'storybook/test';

import { completeOnboardingAction } from '../actions';
import { TemplatePicker } from './template-picker';

const meta = {
  title: 'Onboarding/TemplatePicker',
  component: TemplatePicker,
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TemplatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'Continue' }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole('radio', { name: 'Study a course' }),
    ).toHaveAccessibleDescription('Lectures, Assignments, Exam prep');
  },
};

export const StartsWithThePickedTemplate: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('radio', { name: 'Study a course' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));

    await expect(completeOnboardingAction).toHaveBeenCalledWith({
      templateId: 'course',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  },
};

export const StaysWhenTheServerRefuses: Story = {
  beforeEach: () => {
    mocked(completeOnboardingAction).mockResolvedValue({
      ok: false,
      error: { code: 'INTERNAL' },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Start blank' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Something went wrong',
    );
    await expect(
      canvas.getByRole('radio', { name: 'Start blank' }),
    ).toBeChecked();
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Continue' })).toBeEnabled(),
    );
  },
};
