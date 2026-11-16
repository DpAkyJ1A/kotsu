import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect, mocked } from 'storybook/test';

import { authClient } from '@/lib/auth-client';

import { toNextPath } from '../core/sign-in-paths';
import { EmailForm } from './email-form';

const meta = {
  title: 'Account/EmailForm',
  component: EmailForm,
  args: { next: '/' },
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  beforeEach: () => {
    mocked(authClient.emailOtp.sendVerificationOtp).mockResolvedValue({
      data: { success: true },
      error: null,
    });
  },
} satisfies Meta<typeof EmailForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SendsTheCode: Story = {
  args: { next: toNextPath('/calendar') },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
    await userEvent.click(canvas.getByRole('button', { name: 'Send code' }));

    await expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
      email: 'ada@example.com',
      type: 'sign-in',
    });
    await expect(getRouter().push).toHaveBeenLastCalledWith(
      '/sign-in/code?email=ada%40example.com&next=%2Fcalendar',
    );
  },
};

export const TooManyRequests: Story = {
  beforeEach: () => {
    mocked(authClient.emailOtp.sendVerificationOtp).mockResolvedValue({
      data: null,
      error: { status: 429, statusText: 'Too Many Requests' },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
    await userEvent.click(canvas.getByRole('button', { name: 'Send code' }));

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Too many requests',
    );
    await expect(getRouter().push).not.toHaveBeenCalled();
  },
};
