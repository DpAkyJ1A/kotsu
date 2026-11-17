import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, mocked, waitFor } from 'storybook/test';

import { authClient } from '@/lib/auth-client';

import { PasskeyOffer } from './passkey-offer';

const ADDED_PASSKEY = {
  id: '0193b1c2-7d4e-7000-8000-000000000001',
  publicKey: 'public-key',
  userId: '0193b1c2-7d4e-7000-8000-000000000000',
  credentialID: 'credential-id',
  counter: 0,
  deviceType: 'multiDevice',
  backedUp: true,
  createdAt: new Date('2026-11-16T09:00:00Z'),
} as const;

const meta = {
  title: 'Account/PasskeyOffer',
  component: PasskeyOffer,
  args: { onAnswer: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  beforeEach: () => {
    mocked(authClient.passkey.addPasskey).mockResolvedValue({
      data: null,
      error: { status: 500, statusText: 'Internal Server Error' },
    });
  },
} satisfies Meta<typeof PasskeyOffer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TurnsOnAPasskey: Story = {
  beforeEach: () => {
    mocked(authClient.passkey.addPasskey).mockResolvedValue({
      data: ADDED_PASSKEY,
      error: null,
    });
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Turn on passkey' }),
    );

    await expect(authClient.passkey.addPasskey).toHaveBeenCalledWith({
      authenticatorAttachment: 'platform',
    });
    await expect(args.onAnswer).toHaveBeenCalledOnce();
  },
};

export const LocksNotNowWhileTurningOn: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const reply = Promise.withResolvers<{
      data: typeof ADDED_PASSKEY;
      error: null;
    }>();
    mocked(authClient.passkey.addPasskey).mockReturnValue(reply.promise);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Turn on passkey' }),
    );

    await expect(
      canvas.getByRole('button', { name: 'Not now' }),
    ).toBeDisabled();
    reply.resolve({ data: ADDED_PASSKEY, error: null });
    await waitFor(() => expect(args.onAnswer).toHaveBeenCalledOnce());
  },
};

export const MovesOnWhenTheDeviceHasOneAlready: Story = {
  beforeEach: () => {
    mocked(authClient.passkey.addPasskey).mockResolvedValue({
      data: null,
      error: {
        status: 400,
        statusText: 'BAD_REQUEST',
        code: 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED',
      },
    });
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Turn on passkey' }),
    );

    await expect(args.onAnswer).toHaveBeenCalledOnce();
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
  },
};

export const StaysWhenTheDeviceSaysNo: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Turn on passkey' }),
    );

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      "The passkey wasn't turned on",
    );
    await expect(args.onAnswer).not.toHaveBeenCalled();
  },
};

export const NotNowAnswersTheOffer: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Not now' }));

    await expect(args.onAnswer).toHaveBeenCalledOnce();
    await expect(authClient.passkey.addPasskey).not.toHaveBeenCalled();
  },
};
