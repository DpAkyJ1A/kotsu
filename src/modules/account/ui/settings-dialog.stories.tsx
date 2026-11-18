import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  expect,
  fn,
  mocked,
  screen,
  spyOn,
  waitFor,
  waitForElementToBeRemoved,
} from 'storybook/test';

import { authClient } from '@/lib/auth-client';
import { toast, Toaster } from '@/ui/toast';
import { TooltipProvider } from '@/ui/tooltip';

import { updateSettingsAction } from '../actions';
import type { Settings } from '../core/settings';
import { SettingsDialog } from './settings-dialog';

const SETTINGS: Settings = {
  theme: 'system',
  locale: 'en',
  dayEndsAt: '04:00',
  weekStart: 'monday',
  timeFormat: 'h24',
};

const onPage = (query: Record<string, string>) => ({
  nextjs: { appDirectory: true, navigation: { pathname: '/calendar', query } },
});

const meta = {
  title: 'Account/SettingsDialog',
  component: SettingsDialog,
  args: {
    account: { name: 'Ada Lovelace', email: 'ada@example.com' },
    settings: SETTINGS,
  },
  parameters: onPage({}),
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
        <Toaster />
      </TooltipProvider>
    ),
  ],
  beforeEach: () => {
    mocked(updateSettingsAction).mockResolvedValue({
      ok: true,
      data: SETTINGS,
    });
    return () => {
      toast.dismiss();
    };
  },
} satisfies Meta<typeof SettingsDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

const settingsDialog = () => screen.findByRole('dialog', { name: 'Settings' });

const historyCalls = () => ({
  pushState: spyOn(history, 'pushState').mockImplementation(() => undefined),
  replaceState: spyOn(history, 'replaceState').mockImplementation(
    () => undefined,
  ),
  back: spyOn(history, 'back').mockImplementation(() => undefined),
});

export const OpensOnTheSectionInTheAddress: Story = {
  parameters: onPage({ settings: 'appearance' }),
  play: async () => {
    const dialog = await settingsDialog();

    await expect(
      screen.getByRole('heading', { name: 'Appearance', level: 2 }),
    ).toBeInTheDocument();
    await expect(
      screen.getByRole('button', { name: 'Appearance' }),
    ).toHaveAttribute('aria-current', 'true');
    await expect(dialog).toContainElement(
      screen.getByRole('radiogroup', { name: 'Theme' }),
    );
  },
};

export const OnTheAccountSection: Story = {
  parameters: onPage({ settings: 'account' }),
};

export const OnTheSignInSection: Story = {
  parameters: onPage({ settings: 'security' }),
  beforeEach: () => {
    mocked(authClient.useListPasskeys).mockReturnValue({
      data: [
        {
          id: '0193b1c2-7d4e-7000-8000-000000000001',
          name: 'Google Password Manager',
          publicKey: 'public-key',
          userId: '0193b1c2-7d4e-7000-8000-000000000000',
          credentialID: 'credential-one',
          counter: 3,
          deviceType: 'multiDevice',
          backedUp: true,
          createdAt: new Date('2026-11-16T09:00:00Z'),
        },
      ],
      error: null,
      isPending: false,
      isRefetching: false,
      refetch: fn(() => Promise.resolve()),
    });
  },
  play: async ({ userEvent }) => {
    const dialog = await settingsDialog();
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Google Password Manager' }),
    );
    const removal = await screen.findByRole('dialog', {
      name: 'Remove “Google Password Manager”?',
    });

    await userEvent.keyboard('{Escape}');

    await waitForElementToBeRemoved(removal);
    await expect(dialog).toBeVisible();
    await expect(
      screen.getByRole('button', { name: 'Sign-in & passkeys' }),
    ).toHaveAttribute('aria-current', 'true');
  },
};

export const InRussian: Story = {
  parameters: onPage({ settings: 'appearance' }),
  globals: { locale: 'ru' },
};

export const SwitchesSectionsWithoutAHistoryStep: Story = {
  parameters: onPage({ settings: 'appearance' }),
  play: async ({ userEvent }) => {
    const calls = historyCalls();
    await settingsDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Account' }));

    await expect(calls.replaceState).toHaveBeenLastCalledWith(
      null,
      '',
      expect.stringMatching(/[?&]settings=account$/),
    );
    await expect(calls.pushState).not.toHaveBeenCalled();
  },
};

export const ClosingWhatTheAddressOpenedStaysOnThePage: Story = {
  parameters: onPage({ settings: 'appearance' }),
  play: async ({ userEvent }) => {
    const calls = historyCalls();
    await settingsDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await expect(calls.replaceState).toHaveBeenCalledOnce();
    await expect(calls.replaceState.mock.lastCall?.[2]).not.toMatch(
      /settings=/,
    );
    await expect(calls.back).not.toHaveBeenCalled();
  },
};

export const ClosesOnceThoughClickedTwice: Story = {
  parameters: onPage({ settings: 'appearance' }),
  play: async ({ userEvent }) => {
    const calls = historyCalls();
    await settingsDialog();
    const close = screen.getByRole('button', { name: 'Close' });

    await userEvent.dblClick(close);

    await expect(calls.replaceState).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  },
};

export const OpensWithTheShortcut: Story = {
  play: async ({ userEvent }) => {
    const calls = historyCalls();
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.keyboard('{Meta>}[Comma]{/Meta}');
    await userEvent.keyboard('{Control>}[Comma]{/Control}');

    await waitFor(() => expect(calls.pushState).toHaveBeenCalledTimes(2));
    await expect(calls.pushState).toHaveBeenLastCalledWith(
      null,
      '',
      expect.stringMatching(/[?&]settings=account$/),
    );
  },
};

export const TheShortcutLeavesAnOpenDialogAlone: Story = {
  parameters: onPage({ settings: 'appearance' }),
  play: async ({ userEvent }) => {
    const calls = historyCalls();
    await settingsDialog();

    await userEvent.keyboard('{Meta>}[Comma]{/Meta}');

    await expect(calls.pushState).not.toHaveBeenCalled();
  },
};
