import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect } from 'storybook/test';

import { SidebarProvider } from '@/ui/sidebar';
import { Toaster } from '@/ui/toast';
import { TooltipProvider } from '@/ui/tooltip';

import { createShelfAction, updateShelfAction } from '../actions';
import type { Item } from '../core/item';
import type { Shelf } from '../core/shelf';
import { DOUBLE_CLICK_WAIT_MS } from '../hooks/use-open-unless-double-clicked';
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

type ShelvesScreenStoryArgs = { shelves: Shelf[]; items: Item[] };

const meta = {
  title: 'Shelves/ShelvesScreen',
  args: { shelves: SHELVES, items: [] },
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
    startShelfServer(args);
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

export const RenamesAShelfOnADoubleClickOnItsName: Story = {
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.dblClick(canvas.getByText('Guitar'));

    const name = canvas.getByRole('textbox', { name: 'Shelf name' });
    await expect(name).toHaveFocus();
    await userEvent.keyboard(' lessons{Enter}');

    await expect(updateShelfAction).toHaveBeenLastCalledWith({
      id: SHELVES[1]?.id,
      name: 'Guitar lessons',
    });
    await new Promise((resolve) => setTimeout(resolve, DOUBLE_CLICK_WAIT_MS));
    await expect(getRouter().push).not.toHaveBeenCalled();
  },
};
