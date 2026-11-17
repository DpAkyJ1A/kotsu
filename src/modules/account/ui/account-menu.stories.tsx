import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect, mocked, screen, waitFor } from 'storybook/test';

import { authClient } from '@/lib/auth-client';
import { toast, Toaster } from '@/ui/toast';

import { AccountMenu } from './account-menu';

const meta = {
  title: 'Account/AccountMenu',
  component: AccountMenu,
  args: { account: { name: '', email: 'ada@example.com' } },
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <>
        <div className="flex w-60 bg-sidebar p-3 text-sm">
          <Story />
        </div>
        <Toaster />
      </>
    ),
  ],
  beforeEach: () => {
    mocked(authClient.signOut).mockResolvedValue({
      data: { success: true },
      error: null,
    });
    return () => {
      toast.dismiss();
    };
  },
} satisfies Meta<typeof AccountMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithoutAName: Story = {
  parameters: {
    a11y: { config: { rules: [{ id: 'aria-hidden-focus', enabled: false }] } },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));

    await expect(await screen.findByRole('menu')).toHaveTextContent(
      'ada@example.com',
    );
  },
};

export const WithAName: Story = {
  args: { account: { name: 'Ada Lovelace', email: 'ada@example.com' } },
};

export const SignsOut: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Sign out' }),
    );

    await expect(authClient.signOut).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(getRouter().replace).toHaveBeenLastCalledWith('/sign-in'),
    );
  },
};

export const SignOutFailsOffline: Story = {
  beforeEach: () => {
    mocked(authClient.signOut).mockRejectedValue(
      new TypeError('Failed to fetch'),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Sign out' }),
    );

    const shown = (
      await screen.findByText('Something went wrong. Try again.')
    ).closest('[data-sonner-toast]');
    await waitFor(() => expect(shown).toHaveStyle({ opacity: '1' }));
    await expect(getRouter().replace).not.toHaveBeenCalled();
  },
};
