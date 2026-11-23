import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';

import { DocSaveStatus } from './doc-save-status';

const meta = {
  title: 'Docs/DocSaveStatus',
  component: DocSaveStatus,
  args: { status: 'saved' },
  decorators: [
    (Story) => (
      <div className="flex w-80 items-center gap-3 bg-background p-4 text-sm">
        <span className="text-muted-foreground">Spanish › Verbs</span>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DocSaveStatus>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Saved: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Saved');
  },
};

export const Saving: Story = { args: { status: 'saving' } };

export const Offline: Story = {
  args: { status: 'offline' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveClass('text-destructive');
  },
};

export const TooLong: Story = { args: { status: 'tooLong' } };

export const StorageFull: Story = {
  args: { status: 'storageFull' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Storage full');
    await expect(canvas.getByRole('status')).toHaveClass('text-destructive');
  },
};

export const NotSaved: Story = { args: { status: 'notSaved' } };

export const InRussian: Story = {
  args: { status: 'saving' },
  globals: { locale: 'ru' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Сохранение…');
  },
};
