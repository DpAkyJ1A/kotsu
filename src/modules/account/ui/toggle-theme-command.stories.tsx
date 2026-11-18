import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, mocked, screen, waitFor } from 'storybook/test';

import { CommandGroup } from '@/ui/command';
import { CommandPalette } from '@/ui/command-palette';
import { toast, Toaster } from '@/ui/toast';

import { updateSettingsAction } from '../actions';
import { ToggleThemeCommand } from './toggle-theme-command';

function Palette() {
  return (
    <>
      <CommandPalette isApple>
        <CommandGroup heading="Actions">
          <ToggleThemeCommand />
        </CommandGroup>
      </CommandPalette>
      <Toaster />
    </>
  );
}

const meta = {
  title: 'Account/ToggleThemeCommand',
  component: Palette,
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <div className="flex w-60 flex-col p-3 text-sm">
        <Story />
      </div>
    ),
  ],
  beforeEach: () => {
    mocked(updateSettingsAction).mockResolvedValue({
      ok: true,
      data: {
        theme: 'light',
        locale: 'en',
        dayEndsAt: '04:00',
        weekStart: 'monday',
        timeFormat: 'h24',
      },
    });
    const root = document.documentElement;
    const { theme } = root.dataset;
    return () => {
      if (theme) root.dataset.theme = theme;
      toast.dismiss();
    };
  },
} satisfies Meta<typeof Palette>;

export default meta;

type Story = StoryObj<typeof meta>;

const isClosed = () =>
  waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: 'Search and commands' }),
    ).not.toBeInTheDocument(),
  );

export const FlipsTheThemeAtOnceAndSavesIt: Story = {
  play: async ({ canvas, userEvent }) => {
    const root = document.documentElement;
    const trigger = canvas.getByRole('button', { name: 'Search' });
    const flipped = root.dataset.theme === 'dark' ? 'light' : 'dark';

    await userEvent.keyboard('{Meta>}k{/Meta}');
    await userEvent.keyboard('dark{Enter}');

    await expect(root).toHaveAttribute('data-theme', flipped);
    await expect(
      trigger
        .getAnimations()
        .filter(
          (animation) =>
            animation instanceof CSSTransition &&
            animation.transitionProperty === 'color',
        ),
    ).toEqual([]);
    await expect(updateSettingsAction).toHaveBeenCalledOnce();
    await expect(updateSettingsAction).toHaveBeenLastCalledWith({
      theme: flipped,
    });
    await isClosed();
  },
};

export const KeepsTheFlipWhenSavingFails: Story = {
  beforeEach: () => {
    mocked(updateSettingsAction).mockRejectedValue(
      new TypeError('Failed to fetch'),
    );
  },
  play: async ({ userEvent }) => {
    const root = document.documentElement;
    const flipped = root.dataset.theme === 'dark' ? 'light' : 'dark';

    await userEvent.keyboard('{Meta>}k{/Meta}');
    await userEvent.keyboard('theme{Enter}');

    const failure = (
      await screen.findByText('Something went wrong. Try again.')
    ).closest('[data-sonner-toast]');
    await waitFor(() => expect(failure).toHaveStyle({ opacity: '1' }));
    await expect(root).toHaveAttribute('data-theme', flipped);
  },
};
