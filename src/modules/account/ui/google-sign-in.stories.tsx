import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, mocked } from 'storybook/test';

import {
  authClient,
  platformAuthenticatorIsAvailable,
} from '@/lib/auth-client';

import { toNextPath } from '../core/sign-in-paths';
import { GoogleSignIn } from './google-sign-in';

const GOOGLE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

const meta = {
  title: 'Account/GoogleSignIn',
  component: GoogleSignIn,
  args: { next: '/calendar', hasFailed: false },
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  beforeEach: () => {
    mocked(authClient.signIn.social).mockResolvedValue({
      data: { url: GOOGLE_URL, redirect: true },
      error: null,
    });
    mocked(platformAuthenticatorIsAvailable).mockResolvedValue(false);
  },
} satisfies Meta<typeof GoogleSignIn>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const GoesToGoogleAndBackToTheNextPage: Story = {
  args: { next: toNextPath('/practice') },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Continue with Google' }),
    );

    await expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: '/practice',
      errorCallbackURL: '/sign-in?next=%2Fpractice',
    });
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
  },
};

export const OffersAPasskeyAfterGoogleOnADeviceWithTouchId: Story = {
  beforeEach: () => {
    mocked(platformAuthenticatorIsAvailable).mockResolvedValue(true);
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Continue with Google' }),
    );

    await expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: '/sign-in/passkey',
      errorCallbackURL: '/sign-in',
    });
  },
};

export const CameBackFromAFailedGoogleSignIn: Story = {
  args: { hasFailed: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      "Couldn't sign in with Google",
    );
    await expect(
      canvas.getByRole('button', { name: 'Continue with Google' }),
    ).toHaveAccessibleDescription(/Couldn't sign in with Google/);
  },
};

export const TooManyRequests: Story = {
  beforeEach: () => {
    mocked(authClient.signIn.social).mockResolvedValue({
      data: null,
      error: { status: 429, statusText: 'Too Many Requests' },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Continue with Google' }),
    );

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Too many requests',
    );
  },
};
