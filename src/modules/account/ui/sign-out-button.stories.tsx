import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect, mocked } from 'storybook/test';

import { authClient } from '@/lib/auth-client';

import { SignOutButton } from './sign-out-button';

const meta = {
  title: 'Account/SignOutButton',
  component: SignOutButton,
  parameters: { nextjs: { appDirectory: true } },
  beforeEach: () => {
    mocked(authClient.signOut).mockResolvedValue({
      data: { success: true },
      error: null,
    });
  },
} satisfies Meta<typeof SignOutButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SignsOut: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Sign out' }));

    await expect(authClient.signOut).toHaveBeenCalledOnce();
    await expect(getRouter().replace).toHaveBeenLastCalledWith('/sign-in');
  },
};
