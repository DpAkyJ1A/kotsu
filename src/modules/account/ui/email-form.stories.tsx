import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect, mocked, waitFor } from 'storybook/test';

import { authClient, browserSupportsWebAuthnAutofill } from '@/lib/auth-client';

import { toNextPath } from '../core/sign-in-paths';
import { EmailForm } from './email-form';

const ADA = {
  id: '0193b1c2-7d4e-7000-8000-000000000000',
  email: 'ada@example.com',
  emailVerified: true,
  name: '',
  image: null,
  createdAt: new Date('2026-11-14T09:00:00Z'),
  updatedAt: new Date('2026-11-14T09:00:00Z'),
};

const SESSION = {
  id: '0193b1c2-7d4e-7000-8000-000000000002',
  userId: ADA.id,
  token: 'session-token',
  expiresAt: new Date('2026-11-23T09:00:00Z'),
  createdAt: new Date('2026-11-16T09:00:00Z'),
  updatedAt: new Date('2026-11-16T09:00:00Z'),
};

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
    mocked(browserSupportsWebAuthnAutofill).mockResolvedValue(false);
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

export const SignsInWithAPasskeyFromAutofill: Story = {
  args: { next: toNextPath('/calendar') },
  beforeEach: () => {
    mocked(browserSupportsWebAuthnAutofill).mockResolvedValue(true);
    mocked(authClient.signIn.passkey).mockResolvedValue({
      data: { session: SESSION, user: ADA },
      error: null,
    });
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Email')).toHaveAttribute(
      'autocomplete',
      'username webauthn',
    );
    await waitFor(() =>
      expect(getRouter().replace).toHaveBeenLastCalledWith('/calendar'),
    );
    await expect(authClient.signIn.passkey).toHaveBeenCalledWith({
      autoFill: true,
    });
  },
};

export const ShowsAPasskeyThatFailed: Story = {
  beforeEach: () => {
    mocked(browserSupportsWebAuthnAutofill).mockResolvedValue(true);
    mocked(authClient.signIn.passkey).mockResolvedValue({
      data: null,
      error: {
        status: 401,
        statusText: 'Unauthorized',
        code: 'PASSKEY_NOT_FOUND',
      },
    });
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      "That passkey didn't work",
    );
    await expect(getRouter().replace).not.toHaveBeenCalled();
  },
};

export const StaysQuietWhenAutofillIsDismissed: Story = {
  beforeEach: () => {
    mocked(browserSupportsWebAuthnAutofill).mockResolvedValue(true);
    mocked(authClient.signIn.passkey).mockResolvedValue({
      data: null,
      error: {
        status: 400,
        statusText: 'Bad Request',
        code: 'AUTH_CANCELLED',
      },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await waitFor(() => expect(authClient.signIn.passkey).toHaveBeenCalled());

    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');

    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(getRouter().replace).not.toHaveBeenCalled();
  },
};

export const SkipsAutofillWhereTheBrowserHasNone: Story = {
  play: async () => {
    await waitFor(() =>
      expect(browserSupportsWebAuthnAutofill).toHaveBeenCalled(),
    );

    await expect(authClient.signIn.passkey).not.toHaveBeenCalled();
  },
};
