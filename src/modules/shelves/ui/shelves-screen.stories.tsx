import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';

import { SidebarProvider } from '@/ui/sidebar';
import { Toaster } from '@/ui/toast';
import { TooltipProvider } from '@/ui/tooltip';

import { createShelfAction } from '../actions';
import type { Shelf } from '../core/shelf';
import {
  ShelvesFromServer,
  startShelfServer,
} from './shelf-server-for-stories';
import { ShelvesScreen } from './shelves-screen';

const SHELVES: Shelf[] = [
  {
    id: '019a9c3e-0001-7000-8000-000000000001',
    name: 'Spanish',
    color: 'violet',
  },
  { id: '019a9c3e-0002-7000-8000-000000000002', name: 'Guitar', color: 'blue' },
  {
    id: '019a9c3e-0003-7000-8000-000000000003',
    name: 'Running',
    color: 'amber',
  },
];

type ShelvesScreenStoryArgs = { shelves: Shelf[] };

const meta = {
  title: 'Shelves/ShelvesScreen',
  args: { shelves: SHELVES },
  parameters: { nextjs: { appDirectory: true } },
  globals: { viewport: { value: 'mobile2' } },
  render: () => <ShelvesScreen avatar={null} />,
  decorators: [
    (Story) => (
      <ShelvesFromServer>
        <TooltipProvider>
          <SidebarProvider defaultState="open">
            <Story />
          </SidebarProvider>
        </TooltipProvider>
        <Toaster />
      </ShelvesFromServer>
    ),
  ],
  beforeEach: ({ args }) => {
    startShelfServer(args.shelves);
  },
} satisfies Meta<ShelvesScreenStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OnAPhone: Story = {};

export const OnADesktop: Story = {
  globals: { viewport: { value: 'desktop' } },
};

export const InRussian: Story = { globals: { locale: 'ru' } };

export const StartsFromAnEmptyList: Story = {
  args: { shelves: [] },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('No shelves yet')).toBeVisible();

    await userEvent.click(
      canvas.getAllByRole('button', { name: 'New shelf' }).at(-1) ??
        document.body,
    );
    await userEvent.keyboard('Spanish{Enter}');

    await expect(
      await canvas.findByRole('link', { name: 'Spanish' }),
    ).toBeVisible();
    await expect(createShelfAction).toHaveBeenCalledOnce();
    await expect(canvas.queryByText('No shelves yet')).toBeNull();
  },
};
