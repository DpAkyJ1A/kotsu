import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect, mocked, screen, waitFor } from 'storybook/test';

import { authClient } from '@/lib/auth-client';
import { toast, Toaster } from '@/ui/toast';

import { AccountSection } from './account-section';

const meta = {
  title: 'Account/AccountSection',
  component: AccountSection,
  args: { account: { name: 'Ada Lovelace', email: 'ada@example.com' } },
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <>
        <div className="max-w-120">
          <Story />
        </div>
        <Toaster />
      </>
    ),
  ],
  beforeEach: () => {
    mocked(authClient.updateUser).mockResolvedValue({
      data: { status: true },
      error: null,
    });
    return () => {
      toast.dismiss();
    };
  },
} satisfies Meta<typeof AccountSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const KeepsTheNameShort: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Name')).toHaveAttribute(
      'maxlength',
      '100',
    );
  },
};

export const WithoutAName: Story = {
  args: { account: { name: '', email: 'ada@example.com' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Name')).toHaveAttribute(
      'placeholder',
      'ada',
    );
  },
};

export const SaveWaitsForANewName: Story = {
  play: async ({ canvas, userEvent }) => {
    const save = canvas.getByRole('button', { name: 'Save' });
    await expect(save).toBeDisabled();

    await userEvent.type(canvas.getByLabelText('Name'), '  ');
    await expect(save).toBeDisabled();

    await userEvent.type(canvas.getByLabelText('Name'), ' King');
    await expect(save).toBeEnabled();
  },
};

export const SavesTheName: Story = {
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByLabelText('Name');
    await userEvent.clear(name);
    await userEvent.type(name, '  Ada King {Enter}');

    await expect(authClient.updateUser).toHaveBeenCalledOnce();
    await expect(authClient.updateUser).toHaveBeenLastCalledWith({
      name: 'Ada King',
    });
    await waitFor(() => expect(getRouter().refresh).toHaveBeenCalledOnce());
    await expect(await screen.findByText('Name saved.')).toBeInTheDocument();
  },
};

export const ClearsTheName: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.clear(canvas.getByLabelText('Name'));
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));

    await expect(authClient.updateUser).toHaveBeenLastCalledWith({ name: '' });
  },
};

export const SaysWhenSavingFails: Story = {
  beforeEach: () => {
    mocked(authClient.updateUser).mockResolvedValue({
      data: null,
      error: { status: 500, statusText: 'Internal Server Error' },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Name'), ' King');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));

    const failure = (
      await screen.findByText('Something went wrong. Try again.')
    ).closest('[data-sonner-toast]');
    await waitFor(() => expect(failure).toHaveStyle({ opacity: '1' }));
    await expect(getRouter().refresh).not.toHaveBeenCalled();
    await expect(canvas.getByLabelText('Name')).toHaveValue(
      'Ada Lovelace King',
    );
  },
};
