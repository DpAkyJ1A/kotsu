import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, within } from 'storybook/test';

import { ConflictDialog } from './conflict-dialog';

const meta = {
  title: 'Docs/ConflictDialog',
  component: ConflictDialog,
  args: {
    isOpen: true,
    onReload: fn(),
    onKeepMine: fn(),
    onDecideLater: fn(),
  },
} satisfies Meta<typeof ConflictDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

function dialog() {
  return screen.findByRole('alertdialog', {
    name: 'This doc changed elsewhere',
  });
}

export const Default: Story = {
  play: async () => {
    const shown = await dialog();

    await expect(shown).toHaveAccessibleDescription(
      /another tab or on another device/,
    );
    await expect(shown).toHaveFocus();
  },
};

export const KeysTypedAsItOpensChooseNothing: Story = {
  play: async ({ args, userEvent }) => {
    await dialog();

    await userEvent.keyboard('hablo{Enter} ');

    await expect(args.onReload).not.toHaveBeenCalled();
    await expect(args.onKeepMine).not.toHaveBeenCalled();
    await expect(args.onDecideLater).not.toHaveBeenCalled();
  },
};

export const EachButtonSaysWhatToKeep: Story = {
  play: async ({ args, userEvent }) => {
    const shown = await dialog();

    await userEvent.click(
      within(shown).getByRole('button', { name: 'Reload' }),
    );
    await userEvent.click(
      within(shown).getByRole('button', { name: 'Keep mine' }),
    );

    await expect(args.onReload).toHaveBeenCalledOnce();
    await expect(args.onKeepMine).toHaveBeenCalledOnce();
    await expect(args.onDecideLater).not.toHaveBeenCalled();
  },
};

export const ClosingItPutsTheChoiceOff: Story = {
  play: async ({ args, userEvent }) => {
    await dialog();

    await userEvent.keyboard('{Escape}');

    await expect(args.onDecideLater).toHaveBeenCalledOnce();
    await expect(args.onReload).not.toHaveBeenCalled();
    await expect(args.onKeepMine).not.toHaveBeenCalled();
  },
};

export const OnAPhone: Story = {
  globals: { viewport: { value: 'mobile2' } },
};

export const InRussian: Story = { globals: { locale: 'ru' } };
