import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn } from 'storybook/test';

import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  StrikethroughIcon,
} from './icons';
import { Toolbar, ToolbarButton, ToolbarSeparator } from './toolbar';

type FormattingProps = { onBulletedList: () => void };

function Formatting({ onBulletedList }: FormattingProps) {
  const [isBold, setIsBold] = useState(true);

  return (
    <Toolbar aria-label="Formatting">
      <ToolbarButton
        label="Bold"
        aria-pressed={isBold}
        onClick={() => {
          setIsBold(!isBold);
        }}
      >
        <BoldIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Italic" aria-pressed={false} disabled>
        <ItalicIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Strikethrough" aria-pressed={false}>
        <StrikethroughIcon className="size-4" />
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton label="Bulleted list" onClick={onBulletedList}>
        <ListIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Numbered list">
        <ListOrderedIcon className="size-4" />
      </ToolbarButton>
    </Toolbar>
  );
}

const meta = {
  title: 'Components/Toolbar',
  component: Formatting,
  args: { onBulletedList: fn() },
} satisfies Meta<typeof Formatting>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PressedLightsUpAndAClickToggles: Story = {
  play: async ({ canvas, userEvent }) => {
    const bold = canvas.getByRole('button', { name: 'Bold' });
    await expect(bold).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(bold);

    await expect(bold).toHaveAttribute('aria-pressed', 'false');
  },
};

export const OneTabStopThenArrowsHomeAndEnd: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const button = (name: string) => canvas.getByRole('button', { name });

    await userEvent.tab();
    await expect(button('Bold')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(button('Strikethrough')).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(button('Numbered list')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(button('Bold')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(button('Numbered list')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(button('Bold')).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}{ArrowRight}{Enter}');
    await expect(args.onBulletedList).toHaveBeenCalledOnce();

    await userEvent.tab();
    await expect(document.body).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(button('Bulleted list')).toHaveFocus();
  },
};

export const NothingToPressTakesNoTabStop: Story = {
  render: () => (
    <>
      <Toolbar aria-label="Formatting">
        <ToolbarButton label="Bold" disabled>
          <BoldIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" disabled>
          <ItalicIcon className="size-4" />
        </ToolbarButton>
      </Toolbar>
      <button type="button">Next</button>
    </>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();

    await expect(canvas.getByRole('button', { name: 'Next' })).toHaveFocus();
  },
};

export const ASeparatorSplitsTheButtonsIntoGroups: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
  },
};
