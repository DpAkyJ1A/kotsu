import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';

import {
  CalendarIcon,
  ClockIcon,
  GalleryVerticalEndIcon,
  LibraryIcon,
  SearchIcon,
} from './icons';
import { TabBar, TabBarLink } from './tab-bar';

function Shell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Shelves</h1>
      </main>
      <TabBar>
        <TabBarLink href="/calendar">
          <CalendarIcon />
          Calendar
        </TabBarLink>
        <TabBarLink href="/shelves">
          <LibraryIcon />
          Shelves
        </TabBarLink>
        <TabBarLink href="/practice">
          <GalleryVerticalEndIcon />
          Practice
        </TabBarLink>
        <TabBarLink href="/clock">
          <ClockIcon />
          Clock
        </TabBarLink>
        <TabBarLink href="/search">
          <SearchIcon />
          Search
        </TabBarLink>
      </TabBar>
    </div>
  );
}

const meta = {
  title: 'Components/TabBar',
  component: Shell,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/shelves/spanish' },
    },
  },
} satisfies Meta<typeof Shell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OnAPhone: Story = {
  globals: { viewport: { value: 'mobile2' } },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('link')).toHaveLength(5);
    await expect(canvas.getByRole('link', { name: 'Shelves' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(
      canvas.getByRole('link', { name: 'Calendar' }),
    ).not.toHaveAttribute('aria-current');
  },
};

export const HiddenOnAWideScreen: Story = {
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('nav')).not.toBeVisible();
  },
};
