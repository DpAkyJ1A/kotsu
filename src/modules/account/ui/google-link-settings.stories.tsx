import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect, mocked, waitFor } from 'storybook/test';

import { authClient } from '@/lib/auth-client';

import type { GoogleLink } from '../core/google-link';
import { GoogleLinkSettings } from './google-link-settings';

const GOOGLE_ACCOUNT_ID = '0193b1c2-7d4e-7000-8000-00000000000a';
const ANOTHER_GOOGLE_ACCOUNT_ID = '0193b1c2-7d4e-7000-8000-00000000000b';
const CONNECTED = {
  status: 'connected',
  accountIds: [GOOGLE_ACCOUNT_ID],
} satisfies GoogleLink;

const failed = (status: number, code?: string) => ({
  data: null,
  error: { status, statusText: 'Failed', ...(code && { code }) },
});

const backFromGoogleWith = (error: string) => ({
  nextjs: {
    appDirectory: true,
    navigation: {
      pathname: '/calendar',
      query: { settings: 'security', error },
    },
  },
});

const meta = {
  title: 'Account/GoogleLinkSettings',
  component: GoogleLinkSettings,
  args: { email: 'ada@example.com', link: { status: 'notConnected' } },
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <div className="max-w-120">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GoogleLinkSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NotConnected: Story = {
  play: async ({ canvas }) => {
    const google = canvas.getByRole('region', { name: 'Google' });
    await expect(google).toHaveTextContent(
      'Not connectedada@example.comConnect',
    );
    await expect(google).toHaveTextContent(
      'Signing in with Google connects it too.',
    );
  },
};

export const Connected: Story = {
  args: { link: CONNECTED },
  play: async ({ canvas }) => {
    const google = canvas.getByRole('region', { name: 'Google' });
    await expect(google).toHaveTextContent(
      'Connectedada@example.comDisconnect',
    );
    await expect(google).toHaveTextContent(
      'If you disconnect, signing in with Google connects it again.',
    );
  },
};

export const InRussian: Story = {
  args: { link: CONNECTED },
  globals: { locale: 'ru' },
};

export const ConnectGoesToGoogleAndComesBackHere: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Connect' }));

    await expect(authClient.linkSocial).toHaveBeenCalledOnce();
    const [request] = mocked(authClient.linkSocial).mock.lastCall ?? [];
    await expect(request).toMatchObject({ provider: 'google' });
    await expect(request?.callbackURL).toMatch(/^\/[^?]*\?/);
    await expect(request?.errorCallbackURL).toBe(request?.callbackURL);
  },
};

export const SaysWhenGoogleCannotBeReached: Story = {
  beforeEach: () => {
    mocked(authClient.linkSocial).mockResolvedValue(failed(500));
  },
  play: async ({ canvas, userEvent }) => {
    const connect = canvas.getByRole('button', { name: 'Connect' });

    await userEvent.click(connect);

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      "Google wasn't connected. Try again.",
    );
    await expect(connect).toBeEnabled();
    await expect(connect).toHaveAccessibleDescription(
      "Google wasn't connected. Try again.",
    );
  },
};

export const BackFromGoogleWithAnotherEmail: Story = {
  parameters: backFromGoogleWith('email_does_not_match'),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'That Google account has another email. Pick the one with ada@example.com.',
    );
  },
};

export const BackFromGoogleAfterAFailure: Story = {
  parameters: backFromGoogleWith('unable_to_link_account'),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      "Google wasn't connected. Try again.",
    );
  },
};

export const BackFromGoogleAfterACancel: Story = {
  parameters: backFromGoogleWith('access_denied'),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('alert')).toBeNull();
  },
};

export const Disconnects: Story = {
  args: { link: CONNECTED },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Disconnect' }));

    await expect(authClient.unlinkAccount).toHaveBeenCalledOnce();
    await expect(authClient.unlinkAccount).toHaveBeenLastCalledWith({
      accountId: GOOGLE_ACCOUNT_ID,
    });
    await expect(getRouter().refresh).toHaveBeenCalledOnce();
  },
};

export const SaysWhenDisconnectingFails: Story = {
  args: { link: CONNECTED },
  beforeEach: () => {
    mocked(authClient.unlinkAccount).mockResolvedValue(failed(500));
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Disconnect' }));

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      "Google wasn't disconnected. Try again.",
    );
    await expect(getRouter().refresh).toHaveBeenCalledOnce();
  },
};

export const ConfirmsWithACodeWhenTheSignInIsOld: Story = {
  args: { link: CONNECTED },
  beforeEach: () => {
    mocked(authClient.unlinkAccount).mockResolvedValueOnce(
      failed(403, 'SESSION_NOT_FRESH'),
    );
  },
  play: async ({ canvas, userEvent }) => {
    const disconnect = canvas.getByRole('button', { name: 'Disconnect' });
    await userEvent.click(disconnect);
    const confirmation = await canvas.findByRole('group', {
      name: "Confirm it's you",
    });
    await expect(confirmation).toHaveTextContent(
      "To disconnect Google, enter a code we'll email to ada@example.com.",
    );
    await expect(disconnect).toBeDisabled();
    await expect(
      canvas.getByRole('button', { name: 'Send code' }),
    ).toHaveFocus();

    await userEvent.click(canvas.getByRole('button', { name: 'Send code' }));
    await userEvent.type(await canvas.findByLabelText('Code'), '123456');
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }));

    await expect(authClient.signIn.emailOtp).toHaveBeenCalledWith({
      email: 'ada@example.com',
      otp: '123456',
    });
    await expect(authClient.unlinkAccount).toHaveBeenCalledTimes(2);
    await expect(getRouter().refresh).toHaveBeenCalledOnce();
    await expect(confirmation).not.toBeInTheDocument();
  },
};

export const StaysFocusedAndIgnoresClicksWhileDisconnecting: Story = {
  args: { link: CONNECTED },
  play: async ({ canvas, userEvent }) => {
    const answer = Promise.withResolvers<{ data: null; error: null }>();
    mocked(authClient.unlinkAccount).mockReturnValue(answer.promise);
    const disconnect = canvas.getByRole('button', { name: 'Disconnect' });

    await userEvent.click(disconnect);
    await userEvent.click(disconnect);

    await expect(disconnect).toHaveAttribute('aria-disabled', 'true');
    await expect(disconnect).toHaveFocus();
    await expect(authClient.unlinkAccount).toHaveBeenCalledOnce();
    answer.resolve({ data: null, error: null });
    await waitFor(() => expect(getRouter().refresh).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(disconnect).toHaveAttribute('aria-disabled', 'false'),
    );
  },
};

export const ConfirmingCanBeCancelled: Story = {
  args: { link: CONNECTED },
  beforeEach: () => {
    mocked(authClient.unlinkAccount).mockResolvedValueOnce(
      failed(403, 'SESSION_NOT_FRESH'),
    );
  },
  play: async ({ canvas, userEvent }) => {
    const disconnect = canvas.getByRole('button', { name: 'Disconnect' });
    await userEvent.click(disconnect);
    await canvas.findByRole('group', { name: "Confirm it's you" });

    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));

    await expect(canvas.queryByRole('group')).toBeNull();
    await expect(disconnect).toBeEnabled();
    await expect(disconnect).toHaveFocus();
    await expect(authClient.unlinkAccount).toHaveBeenCalledOnce();
  },
};

export const DisconnectsEveryGoogleAccountOfTheUser: Story = {
  args: {
    link: {
      status: 'connected',
      accountIds: [GOOGLE_ACCOUNT_ID, ANOTHER_GOOGLE_ACCOUNT_ID],
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Disconnect' }));

    await expect(mocked(authClient.unlinkAccount).mock.calls).toEqual([
      [{ accountId: GOOGLE_ACCOUNT_ID }],
      [{ accountId: ANOTHER_GOOGLE_ACCOUNT_ID }],
    ]);
    await expect(getRouter().refresh).toHaveBeenCalledOnce();
  },
};
