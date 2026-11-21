import type { Passkey } from '@better-auth/passkey';
import { BetterFetchError } from '@better-fetch/fetch';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  expect,
  fn,
  mocked,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from 'storybook/test';

import { authClient } from '@/lib/auth-client';
import { toast, Toaster } from '@/ui/toast';
import { TooltipProvider } from '@/ui/tooltip';

import { PasskeysSettings } from './passkeys-settings';

const PASSWORD_MANAGER_PASSKEY: Passkey = {
  id: '0193b1c2-7d4e-7000-8000-000000000001',
  name: 'Google Password Manager',
  publicKey: 'public-key',
  userId: '0193b1c2-7d4e-7000-8000-000000000000',
  credentialID: 'credential-one',
  counter: 3,
  deviceType: 'multiDevice',
  backedUp: true,
  createdAt: new Date('2026-11-16T09:00:00Z'),
};

const UNNAMED_PASSKEY: Passkey = {
  id: '0193b1c2-7d4e-7000-8000-000000000002',
  publicKey: 'public-key',
  userId: '0193b1c2-7d4e-7000-8000-000000000000',
  credentialID: 'credential-two',
  counter: 0,
  deviceType: 'singleDevice',
  backedUp: false,
  createdAt: new Date('2025-03-02T18:30:00Z'),
};

const failed = (status: number, code?: string) => ({
  data: null,
  error: { status, statusText: 'Failed', ...(code && { code }) },
});

const refetch = fn(() => Promise.resolve());
const signalUnknownCredential = fn(() => Promise.resolve());

type ListState = ReturnType<typeof authClient.useListPasskeys>;

function listOf(passkeys: Passkey[] | null, error: ListState['error'] = null) {
  mocked(authClient.useListPasskeys).mockReturnValue({
    data: passkeys,
    error,
    isPending: passkeys === null && error === null,
    isRefetching: false,
    refetch,
  });
}

function stubSignalApi() {
  Object.defineProperty(PublicKeyCredential, 'signalUnknownCredential', {
    value: signalUnknownCredential,
    configurable: true,
  });
}

async function shownToast(text: string) {
  const shown = (await screen.findByText(text)).closest('[data-sonner-toast]');
  await waitFor(() => expect(shown).toHaveStyle({ opacity: '1' }));
}

const meta = {
  title: 'Account/PasskeysSettings',
  component: PasskeysSettings,
  args: { email: 'ada@example.com' },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="max-w-120">
          <Story />
        </div>
        <Toaster />
      </TooltipProvider>
    ),
  ],
  beforeEach: () => {
    listOf([PASSWORD_MANAGER_PASSKEY, UNNAMED_PASSKEY]);
    const browserSignal = Object.getOwnPropertyDescriptor(
      PublicKeyCredential,
      'signalUnknownCredential',
    );
    stubSignalApi();
    return () => {
      Reflect.deleteProperty(PublicKeyCredential, 'signalUnknownCredential');
      if (browserSignal) {
        Object.defineProperty(
          PublicKeyCredential,
          'signalUnknownCredential',
          browserSignal,
        );
      }
      toast.dismiss();
    };
  },
} satisfies Meta<typeof PasskeysSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const rows = canvas.getAllByRole('listitem');
    await expect(rows[0]).toHaveTextContent('PasskeyAdded Mar 2, 2025');
    await expect(rows[1]).toHaveTextContent(
      'Google Password ManagerAdded Nov 16, 2026 · Synced',
    );
  },
};

export const ExplainsWhatSyncedMeans: Story = {
  play: async ({ canvas, userEvent }) => {
    const hint = canvas.getByRole('button', { name: 'What “Synced” means' });

    await userEvent.click(hint);

    await expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Your password manager keeps this passkey on every device signed in to the same account, so it works there too.',
    );
    await expect(hint).toHaveAccessibleDescription(
      'Your password manager keeps this passkey on every device signed in to the same account, so it works there too.',
    );
    await expect(
      canvas.getAllByRole('button', { name: 'What “Synced” means' }),
    ).toHaveLength(1);
  },
};

export const InRussian: Story = { globals: { locale: 'ru' } };

export const Empty: Story = {
  beforeEach: () => {
    listOf([]);
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No passkeys yet.')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Add passkey' }),
    ).toBeEnabled();
  },
};

export const Loading: Story = {
  beforeEach: () => {
    listOf(null);
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Loading your passkeys…',
    );
  },
};

export const LoadingFailed: Story = {
  beforeEach: () => {
    listOf(null, new BetterFetchError(500, 'Internal Server Error', null));
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      "Couldn't load your passkeys.",
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));

    await expect(refetch).toHaveBeenCalledOnce();
  },
};

export const AddsAPasskey: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add passkey' }));

    await expect(authClient.passkey.addPasskey).toHaveBeenCalledOnce();
    await expect(authClient.passkey.addPasskey).toHaveBeenLastCalledWith();
    await shownToast('Passkey added.');
  },
};

export const SaysWhenAddingFails: Story = {
  beforeEach: () => {
    mocked(authClient.passkey.addPasskey).mockResolvedValue(
      failed(400, 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY'),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add passkey' }));

    await shownToast("The passkey wasn't added. Try again.");
    await expect(
      canvas.getByRole('button', { name: 'Add passkey' }),
    ).toBeEnabled();
  },
};

export const SaysWhenTheAuthenticatorHasOne: Story = {
  beforeEach: () => {
    mocked(authClient.passkey.addPasskey).mockResolvedValue(
      failed(400, 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED'),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add passkey' }));

    await shownToast('This device already has a passkey for Kotsu.');
  },
};

export const ConfirmsWithACodeWhenTheSignInIsOld: Story = {
  beforeEach: () => {
    mocked(authClient.passkey.addPasskey)
      .mockResolvedValueOnce(failed(403, 'SESSION_NOT_FRESH'))
      .mockResolvedValueOnce({ data: PASSWORD_MANAGER_PASSKEY, error: null });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add passkey' }));
    const confirmation = await canvas.findByRole('group', {
      name: "Confirm it's you",
    });
    await expect(confirmation).toHaveTextContent(
      "To add a passkey, enter a code we'll email to ada@example.com.",
    );
    await expect(
      authClient.emailOtp.sendVerificationOtp,
    ).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole('button', { name: 'Send code' }));
    await expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
      email: 'ada@example.com',
      type: 'sign-in',
    });
    const code = await canvas.findByLabelText('Code');
    await expect(code).toHaveFocus();
    await userEvent.type(code, '123 456');
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }));

    await expect(authClient.signIn.emailOtp).toHaveBeenCalledWith({
      email: 'ada@example.com',
      otp: '123456',
    });
    await expect(await canvas.findByRole('status')).toHaveTextContent(
      'Confirmed. Now add your passkey.',
    );
    await expect(confirmation).not.toBeInTheDocument();
    const add = canvas.getByRole('button', { name: 'Add passkey' });
    await expect(add).toHaveFocus();
    await expect(authClient.passkey.addPasskey).toHaveBeenCalledOnce();

    await userEvent.keyboard('{Enter}');

    await expect(authClient.passkey.addPasskey).toHaveBeenCalledTimes(2);
    await shownToast('Passkey added.');
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
  },
};

export const SaysWhenTheCodeCannotBeSent: Story = {
  beforeEach: () => {
    mocked(authClient.passkey.addPasskey).mockResolvedValue(
      failed(403, 'SESSION_NOT_FRESH'),
    );
    mocked(authClient.emailOtp.sendVerificationOtp).mockResolvedValue(
      failed(429),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add passkey' }));
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Send code' }),
    );

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Too many requests. Wait a minute and try again.',
    );
    await expect(canvas.queryByLabelText('Code')).not.toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: 'Send code' }),
    ).toBeEnabled();
  },
};

export const AWrongCodeKeepsAsking: Story = {
  beforeEach: () => {
    mocked(authClient.passkey.addPasskey).mockResolvedValue(
      failed(403, 'SESSION_NOT_FRESH'),
    );
    mocked(authClient.signIn.emailOtp).mockResolvedValue(
      failed(400, 'INVALID_OTP'),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add passkey' }));
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Send code' }),
    );
    await userEvent.type(await canvas.findByLabelText('Code'), '000000{Enter}');

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      "That code isn't right. Check the email and try again.",
    );
    await expect(canvas.getByLabelText('Code')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(authClient.passkey.addPasskey).toHaveBeenCalledOnce();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Send a new code' }),
    );
    await expect(await canvas.findByRole('status')).toHaveTextContent(
      'A new code is on its way.',
    );
  },
};

export const CancelsTheConfirmation: Story = {
  beforeEach: () => {
    mocked(authClient.passkey.addPasskey).mockResolvedValue(
      failed(403, 'SESSION_NOT_FRESH'),
    );
  },
  play: async ({ canvas, userEvent }) => {
    const add = canvas.getByRole('button', { name: 'Add passkey' });
    await userEvent.click(add);
    await expect(add).toBeDisabled();

    await userEvent.click(
      await canvas.findByRole('button', { name: 'Cancel' }),
    );

    await expect(canvas.queryByRole('group')).not.toBeInTheDocument();
    await expect(add).toBeEnabled();
  },
};

export const RenamesAPasskey: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Rename Google Password Manager' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Rename passkey',
    });
    const name = screen.getByLabelText('Name');
    await expect(name).toHaveValue('Google Password Manager');
    await expect(name).toHaveFocus();

    await userEvent.clear(name);
    await userEvent.type(name, '  Work laptop {Enter}');

    await expect(authClient.passkey.updatePasskey).toHaveBeenCalledWith({
      id: PASSWORD_MANAGER_PASSKEY.id,
      name: 'Work laptop',
    });
    await waitForElementToBeRemoved(dialog);
  },
};

export const RenamingAnUnnamedPasskeyStartsEmpty: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Rename Passkey' }),
    );

    await expect(await screen.findByLabelText('Name')).toHaveValue('');
  },
};

export const ANameIsNeeded: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Rename Google Password Manager' }),
    );
    const name = await screen.findByLabelText('Name');
    await userEvent.clear(name);
    await userEvent.type(name, '   {Enter}');

    await expect(name).toBeInvalid();
    await expect(authClient.passkey.updatePasskey).not.toHaveBeenCalled();
  },
};

export const SaysWhenRenamingFails: Story = {
  beforeEach: () => {
    mocked(authClient.passkey.updatePasskey).mockResolvedValue(failed(500));
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Rename Google Password Manager' }),
    );
    await userEvent.type(await screen.findByLabelText('Name'), ' 2{Enter}');

    await shownToast("The passkey wasn't renamed. Try again.");
    await expect(
      screen.getByRole('dialog', { name: 'Rename passkey' }),
    ).toBeVisible();
  },
};

export const RemovesAPasskey: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Google Password Manager' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Remove “Google Password Manager”?',
    });
    await expect(dialog).toHaveAccessibleDescription(
      'You can still sign in with an email code.',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await expect(authClient.passkey.deletePasskey).toHaveBeenCalledWith({
      id: PASSWORD_MANAGER_PASSKEY.id,
    });
    await waitForElementToBeRemoved(dialog);
    await expect(signalUnknownCredential).toHaveBeenCalledWith({
      rpId: location.hostname,
      credentialId: 'credential-one',
    });
  },
};

export const ARefusedSignalStillRemovesThePasskey: Story = {
  beforeEach: () => {
    signalUnknownCredential.mockRejectedValueOnce(
      new DOMException('The RP ID is invalid for this domain', 'SecurityError'),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Google Password Manager' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Remove “Google Password Manager”?',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitForElementToBeRemoved(dialog);
    await expect(signalUnknownCredential).toHaveBeenCalledOnce();
    await expect(screen.queryByText(/wasn't removed/)).not.toBeInTheDocument();
  },
};

export const RemovingWithoutTheSignalApiPointsToThePasswordManager: Story = {
  beforeEach: () => {
    Reflect.deleteProperty(PublicKeyCredential, 'signalUnknownCredential');
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Google Password Manager' }),
    );

    await expect(
      await screen.findByRole('dialog', {
        name: 'Remove “Google Password Manager”?',
      }),
    ).toHaveAccessibleDescription(
      'You can still sign in with an email code. Your password manager keeps it until you delete it there too.',
    );
  },
};

export const SaysWhenRemovingFails: Story = {
  beforeEach: () => {
    mocked(authClient.passkey.deletePasskey).mockResolvedValue(failed(500));
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Google Password Manager' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Remove' }),
    );

    await shownToast("The passkey wasn't removed. Try again.");
    await expect(
      screen.getByRole('dialog', { name: 'Remove “Google Password Manager”?' }),
    ).toBeVisible();
    await expect(signalUnknownCredential).not.toHaveBeenCalled();
  },
};
