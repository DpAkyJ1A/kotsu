import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';

import type { Storage } from '../core/storage';
import { StorageUsage } from './storage-usage';

const QUOTA = 50_000_000;

const SHELVES: Storage['shelves'] = [
  {
    id: '019a9c3e-0001-7000-8000-000000000001',
    name: 'Spanish',
    color: 'violet',
    bytes: 21_400_000,
  },
  {
    id: '019a9c3e-0002-7000-8000-000000000002',
    name: 'Guitar',
    color: 'amber',
    bytes: 9_800_000,
  },
  {
    id: '019a9c3e-0003-7000-8000-000000000003',
    name: 'Running',
    color: 'green',
    bytes: 2_100_000,
  },
];

const DOCS: Storage['docs'] = [
  {
    id: '019a9c3e-0101-7000-8000-000000000101',
    title: 'Verbs: every tense with examples',
    color: 'violet',
    bytes: 8_200_000,
  },
  {
    id: '019a9c3e-0102-7000-8000-000000000102',
    title: 'Chords',
    color: 'amber',
    bytes: 4_400_000,
  },
  {
    id: '019a9c3e-0103-7000-8000-000000000103',
    title: 'Training plan',
    color: 'green',
    bytes: 640_000,
  },
];

const DOC_CEILING =
  'One doc holds up to 500 kB, about 100–350 thousand characters.';

function storageOf(usedBytes: number, quotaBytes: number | null = QUOTA) {
  return { usedBytes, quotaBytes, shelves: SHELVES, docs: DOCS };
}

const meta = {
  title: 'Shelves/StorageUsage',
  component: StorageUsage,
  args: {
    storage: storageOf(33_300_000),
    docCeiling: <p className="text-xs text-muted-foreground">{DOC_CEILING}</p>,
  },
  decorators: [
    (Story) => (
      <div className="w-96 bg-background p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StorageUsage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PlentyOfRoom: Story = {
  play: async ({ canvas }) => {
    const meter = canvas.getByRole('meter', { name: 'Storage used' });
    await expect(meter).toHaveAttribute('aria-valuenow', '33300000');
    await expect(meter).toHaveAttribute('aria-valuemax', String(QUOTA));
    await expect(meter).toHaveAttribute('aria-valuetext', '33 MB of 50 MB');
    await expect(canvas.getByText('17 MB left')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Spanish 21 MB' }),
    ).toHaveAttribute('href', `/shelves/${SHELVES[0]?.id ?? ''}`);
    await expect(
      canvas.getByRole('link', { name: 'Training plan 640 kB' }),
    ).toHaveAttribute('href', `/docs/${DOCS[2]?.id ?? ''}`);
    await expect(canvas.getByText(DOC_CEILING)).toBeVisible();
  },
};

export const RunningLow: Story = {
  args: { storage: storageOf(41_000_000) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Running low: 9 MB left')).toHaveClass(
      'text-amber-foreground',
    );
  },
};

export const AlmostFull: Story = {
  args: { storage: storageOf(48_600_000) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Almost full: 1.4 MB left')).toHaveClass(
      'text-destructive',
    );
  },
};

export const FullAfterTheQuotaWentDown: Story = {
  args: { storage: storageOf(61_000_000) },
  play: async ({ canvas }) => {
    const meter = canvas.getByRole('meter', { name: 'Storage used' });
    await expect(meter).toHaveAttribute('aria-valuenow', String(QUOTA));
    await expect(meter).toHaveAttribute('aria-valuetext', '61 MB of 50 MB');
    await expect(canvas.getByText("Full: changes aren't saved")).toBeVisible();
  },
};

export const WithoutALimit: Story = {
  args: { storage: storageOf(33_300_000, null) },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('meter')).not.toBeInTheDocument();
    await expect(canvas.getByText('33 MB used')).toBeVisible();
    await expect(
      canvas.getByText("There's no storage limit on this server."),
    ).toBeVisible();
  },
};

export const NothingYet: Story = {
  args: {
    storage: { usedBytes: 0, quotaBytes: QUOTA, shelves: [], docs: [] },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Nothing takes room yet.')).toBeVisible();
    await expect(canvas.getByText(DOC_CEILING)).toBeVisible();
    await expect(canvas.queryByRole('list')).not.toBeInTheDocument();
  },
};

export const InRussian: Story = {
  args: {
    storage: storageOf(41_000_000),
    docCeiling: (
      <p className="text-xs text-muted-foreground">
        В один док помещается до 500 кБ, примерно 100–350 тысяч символов.
      </p>
    ),
  },
  globals: { locale: 'ru' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('meter', { name: 'Занято места' }),
    ).toHaveAttribute('aria-valuetext', '41 МБ из 50 МБ');
  },
};
