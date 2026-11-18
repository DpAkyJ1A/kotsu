import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect, mocked, screen, spyOn, waitFor } from 'storybook/test';

import { authClient } from '@/lib/auth-client';
import { toast, Toaster } from '@/ui/toast';

import { updateSettingsAction } from '../actions';
import type { Settings } from '../core/settings';
import { AccountMenu } from './account-menu';

const SETTINGS: Settings = {
  theme: 'system',
  locale: 'en',
  dayEndsAt: '04:00',
  weekStart: 'monday',
  timeFormat: 'h24',
};

const meta = {
  title: 'Account/AccountMenu',
  component: AccountMenu,
  args: {
    account: { name: '', email: 'ada@example.com' },
    settings: SETTINGS,
  },
  parameters: {
    nextjs: { appDirectory: true },
    a11y: { config: { rules: [{ id: 'aria-hidden-focus', enabled: false }] } },
  },
  decorators: [
    (Story) => (
      <>
        <div className="flex w-60 bg-sidebar p-3 text-sm">
          <Story />
        </div>
        <Toaster />
      </>
    ),
  ],
  beforeEach: () => {
    mocked(authClient.signOut).mockResolvedValue({
      data: { success: true },
      error: null,
    });
    mocked(updateSettingsAction).mockResolvedValue({
      ok: true,
      data: SETTINGS,
    });
    const root = document.documentElement;
    const { theme } = root.dataset;
    return () => {
      if (theme) root.dataset.theme = theme;
      toast.dismiss();
    };
  },
} satisfies Meta<typeof AccountMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

const option = (name: string) => screen.getByRole('menuitemradio', { name });

const theOtherTheme = () =>
  document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';

export const WithoutAName: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));

    await expect(await screen.findByRole('menu')).toHaveTextContent(
      'ada@example.com',
    );
  },
};

export const WithAName: Story = {
  args: { account: { name: 'Ada Lovelace', email: 'ada@example.com' } },
};

export const ShowsTheSavedSettings: Story = {
  args: {
    settings: { ...SETTINGS, theme: 'dark', locale: 'ru' },
  },
  globals: { theme: 'dark' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));

    await expect(option('Dark')).toBeChecked();
    await expect(
      screen.getByRole('group', { name: 'Language' }),
    ).toBeInTheDocument();
    await expect(option('Русский')).toBeChecked();
  },
};

export const PicksATheme: Story = {
  play: async ({ canvas, userEvent }) => {
    const saving = Promise.withResolvers<undefined>();
    mocked(updateSettingsAction).mockImplementation(async () => {
      await saving.promise;
      return { ok: true, data: SETTINGS };
    });
    const picked = theOtherTheme();
    const name = picked === 'dark' ? 'Dark' : 'Light';

    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));
    await userEvent.click(option(name));

    await expect(document.documentElement).toHaveAttribute(
      'data-theme',
      picked,
    );
    await expect(option(name)).toBeChecked();
    await expect(screen.getByRole('menu')).toBeInTheDocument();
    await expect(updateSettingsAction).toHaveBeenCalledOnce();
    await expect(updateSettingsAction).toHaveBeenLastCalledWith({
      theme: picked,
    });
    saving.resolve(undefined);
  },
};

export const AutoLeavesTheThemeToTheSystem: Story = {
  args: { settings: { ...SETTINGS, theme: 'dark' } },
  globals: { theme: 'dark' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));
    await userEvent.click(option('Auto'));

    await expect(document.documentElement).not.toHaveAttribute('data-theme');
    await expect(updateSettingsAction).toHaveBeenCalledOnce();
    await expect(updateSettingsAction).toHaveBeenLastCalledWith({
      theme: 'system',
    });
  },
};

export const KeepsThePickedThemeWhenSavingFails: Story = {
  globals: { theme: 'light' },
  beforeEach: () => {
    mocked(updateSettingsAction).mockResolvedValue({
      ok: false,
      error: { code: 'VALIDATION' },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));
    await userEvent.click(option('Dark'));

    const failure = (
      await screen.findByText(
        "That couldn't be saved. Reload the page and try again.",
      )
    ).closest('[data-sonner-toast]');
    await waitFor(() => expect(failure).toHaveStyle({ opacity: '1' }));
    await expect(document.documentElement).toHaveAttribute(
      'data-theme',
      'dark',
    );
    await expect(option('Dark')).toBeChecked();
  },
};

export const SavesAThemePickedOfflineOnceBackOnline: Story = {
  globals: { theme: 'light' },
  play: async ({ canvas, userEvent }) => {
    const isOnline = spyOn(navigator, 'onLine', 'get');
    mocked(updateSettingsAction).mockImplementationOnce(() => {
      isOnline.mockReturnValue(false);
      return Promise.reject(new TypeError('Failed to fetch'));
    });

    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));
    await userEvent.click(option('Dark'));
    await userEvent.click(option('Auto'));

    await expect(document.documentElement).not.toHaveAttribute('data-theme');
    await expect(option('Auto')).toBeChecked();
    await expect(updateSettingsAction).toHaveBeenCalledOnce();

    isOnline.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));

    await waitFor(() => expect(updateSettingsAction).toHaveBeenCalledTimes(2));
    await expect(updateSettingsAction).toHaveBeenLastCalledWith({
      theme: 'system',
    });
    await expect(document.querySelector('[data-sonner-toast]')).toBeNull();

    window.dispatchEvent(new Event('online'));
    await expect(updateSettingsAction).toHaveBeenCalledTimes(2);
  },
};

export const PicksALanguage: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));
    await userEvent.click(option('Русский'));

    await expect(updateSettingsAction).toHaveBeenCalledOnce();
    await expect(updateSettingsAction).toHaveBeenLastCalledWith({
      locale: 'ru',
    });
  },
};

export const KeepsTheLanguageOffline: Story = {
  play: async ({ canvas, userEvent }) => {
    spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));
    await userEvent.click(option('Русский'));

    const failure = (
      await screen.findByText(
        "You're offline. Try again once you're back online.",
      )
    ).closest('[data-sonner-toast]');
    await waitFor(() => expect(failure).toHaveStyle({ opacity: '1' }));
    await expect(option('English')).toBeChecked();
  },
};

export const SignsOut: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Sign out' }),
    );

    await expect(authClient.signOut).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(getRouter().replace).toHaveBeenLastCalledWith('/sign-in'),
    );
  },
};

export const SignOutFailsOffline: Story = {
  beforeEach: () => {
    mocked(authClient.signOut).mockRejectedValue(
      new TypeError('Failed to fetch'),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ada' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Sign out' }),
    );

    const shown = (
      await screen.findByText('Something went wrong. Try again.')
    ).closest('[data-sonner-toast]');
    await waitFor(() => expect(shown).toHaveStyle({ opacity: '1' }));
    await expect(getRouter().replace).not.toHaveBeenCalled();
  },
};
