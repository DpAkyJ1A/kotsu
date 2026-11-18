import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect, waitFor } from 'storybook/test';

import { authClient } from '@/lib/auth-client';

import { SettingsList } from './settings-list';

const meta = {
  title: 'Account/SettingsList',
  component: SettingsList,
  args: {
    account: { name: 'Ada Lovelace', email: 'ada@example.com' },
    settings: {
      theme: 'system',
      locale: 'en',
      dayEndsAt: '04:00',
      weekStart: 'monday',
      timeFormat: 'h24',
    },
  },
  parameters: { nextjs: { appDirectory: true } },
  globals: { viewport: { value: 'mobile2' } },
} satisfies Meta<typeof SettingsList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: /^Ada Lovelace/ }),
    ).toHaveAttribute('href', '/settings/account');
    await expect(
      canvas.getByRole('link', { name: 'Appearance Auto · English' }),
    ).toHaveAttribute('href', '/settings/appearance');
  },
};

export const InRussian: Story = {
  globals: { locale: 'ru' },
  args: {
    settings: {
      theme: 'dark',
      locale: 'ru',
      dayEndsAt: '04:00',
      weekStart: 'monday',
      timeFormat: 'h24',
    },
  },
};

export const SignsOut: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Sign out' }));

    await expect(authClient.signOut).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(getRouter().replace).toHaveBeenLastCalledWith('/sign-in'),
    );
  },
};
