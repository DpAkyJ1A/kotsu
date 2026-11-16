import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect, mocked, waitFor } from 'storybook/test';

import { authClient } from '@/lib/auth-client';

import { toNextPath } from '../core/sign-in-paths';
import { CodeForm } from './code-form';

const ADA = {
  id: '0193b1c2-7d4e-7000-8000-000000000000',
  email: 'ada@example.com',
  emailVerified: true,
  name: '',
  image: null,
  createdAt: new Date('2026-11-14T09:00:00Z'),
  updatedAt: new Date('2026-11-14T09:00:00Z'),
};

const WRONG_CODE = {
  data: null,
  error: { status: 400, statusText: 'Bad Request', code: 'INVALID_OTP' },
};

const meta = {
  title: 'Account/CodeForm',
  component: CodeForm,
  args: { email: 'ada@example.com', next: toNextPath('/calendar') },
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  beforeEach: () => {
    mocked(authClient.signIn.emailOtp).mockResolvedValue(WRONG_CODE);
    mocked(authClient.emailOtp.sendVerificationOtp).mockResolvedValue({
      data: { success: true },
      error: null,
    });
  },
} satisfies Meta<typeof CodeForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SignsInOnTheSixthDigit: Story = {
  beforeEach: () => {
    mocked(authClient.signIn.emailOtp).mockResolvedValue({
      data: { token: 'session-token', user: ADA },
      error: null,
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Code'), '12 34 56');

    await expect(authClient.signIn.emailOtp).toHaveBeenCalledOnce();
    await expect(authClient.signIn.emailOtp).toHaveBeenLastCalledWith({
      email: 'ada@example.com',
      otp: '123456',
    });
    await expect(getRouter().replace).toHaveBeenLastCalledWith('/calendar');
  },
};

export const SignsInWithAPastedCode: Story = {
  beforeEach: () => {
    mocked(authClient.signIn.emailOtp).mockResolvedValue({
      data: { token: 'session-token', user: ADA },
      error: null,
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByLabelText('Code'));
    await userEvent.paste(' 123 456');

    await expect(authClient.signIn.emailOtp).toHaveBeenLastCalledWith({
      email: 'ada@example.com',
      otp: '123456',
    });
  },
};

export const WrongCode: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Code'), '000000');

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      "That code isn't right",
    );
    await expect(canvas.getByLabelText('Code')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(getRouter().replace).not.toHaveBeenCalled();
  },
};

export const LocksTheCodeWhileSigningIn: Story = {
  play: async ({ canvas, userEvent }) => {
    const reply = Promise.withResolvers<typeof WRONG_CODE>();
    mocked(authClient.signIn.emailOtp).mockReturnValue(reply.promise);
    const input = canvas.getByLabelText('Code');

    await userEvent.type(input, '123456');
    await userEvent.type(input, '{Backspace}9');

    await expect(input).toHaveValue('123456');
    reply.resolve(WRONG_CODE);
    await waitFor(() => expect(input).not.toHaveAttribute('readonly'));
  },
};

export const IgnoresASeventhDigit: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Code');
    await userEvent.type(input, '000000');
    await canvas.findByRole('alert');

    await userEvent.type(input, '7');

    await expect(input).toHaveValue('000000');
    await expect(authClient.signIn.emailOtp).toHaveBeenCalledOnce();
  },
};

export const SendsANewCode: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Code'), '000000');
    await canvas.findByRole('alert');

    await userEvent.click(
      canvas.getByRole('button', { name: 'Send a new code' }),
    );

    await expect(await canvas.findByRole('status')).toHaveTextContent(
      'A new code is on its way',
    );
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(canvas.getByLabelText('Code')).toHaveValue('');
  },
};
