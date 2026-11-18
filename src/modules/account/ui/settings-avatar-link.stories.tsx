import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';

import { SettingsAvatarLink } from './settings-avatar-link';

const meta = {
  title: 'Account/SettingsAvatarLink',
  component: SettingsAvatarLink,
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
} satisfies Meta<typeof SettingsAvatarLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LeadsToSettings: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Settings' });
    await expect(link).toHaveAttribute('href', '/settings');
    await expect(link).toHaveTextContent('A');
  },
};
