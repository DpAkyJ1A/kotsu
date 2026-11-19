import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';

import { PrivacyPolicy } from './privacy-policy';

const meta = {
  title: 'Account/PrivacyPolicy',
  component: PrivacyPolicy,
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PrivacyPolicy>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InRussian: Story = {
  globals: { locale: 'ru' },
};

export const KeepsItsDateWestOfUtc: Story = {
  globals: { timeZone: 'America/Los_Angeles' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Last updated Nov 19, 2026')).toBeVisible();
  },
};
