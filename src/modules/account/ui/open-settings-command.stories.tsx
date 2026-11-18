import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, spyOn, waitFor } from 'storybook/test';

import { CommandGroup } from '@/ui/command';
import { CommandPalette } from '@/ui/command-palette';

import { OpenSettingsCommand } from './open-settings-command';

function Palette() {
  return (
    <CommandPalette isApple>
      <CommandGroup heading="Go to">
        <OpenSettingsCommand />
      </CommandGroup>
    </CommandPalette>
  );
}

const meta = {
  title: 'Account/OpenSettingsCommand',
  component: Palette,
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <div className="flex w-60 flex-col p-3 text-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Palette>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OpensSettingsOverThePage: Story = {
  play: async ({ userEvent }) => {
    const pushState = spyOn(history, 'pushState').mockImplementation(
      () => undefined,
    );

    await userEvent.keyboard('{Meta>}k{/Meta}');
    await userEvent.keyboard('sett{Enter}');

    await expect(pushState).toHaveBeenLastCalledWith(
      null,
      '',
      expect.stringMatching(/[?&]settings=account$/),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Search and commands' }),
      ).not.toBeInTheDocument(),
    );
  },
};
