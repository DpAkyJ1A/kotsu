import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen } from 'storybook/test';

import { AccountAvatarMenu } from './account-avatar-menu';

const meta = {
  title: 'Account/AccountAvatarMenu',
  component: AccountAvatarMenu,
  args: { account: { name: '', email: 'ada@example.com' } },
  parameters: { nextjs: { appDirectory: true } },
  globals: { viewport: { value: 'mobile2' } },
  decorators: [
    (Story) => (
      <div className="flex justify-end px-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountAvatarMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithoutAName: Story = {
  parameters: {
    a11y: { config: { rules: [{ id: 'aria-hidden-focus', enabled: false }] } },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));

    await expect(await screen.findByRole('menu')).toHaveTextContent(
      'ada@example.comSign out',
    );
  },
};

export const WithAName: Story = {
  args: { account: { name: 'Ada Lovelace', email: 'ada@example.com' } },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'Ada Lovelace' }),
    ).toHaveTextContent('A');
  },
};
