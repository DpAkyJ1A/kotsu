import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect, fn, screen, waitFor } from 'storybook/test';

import { CommandGroup } from './command';
import {
  CommandPalette,
  CommandPaletteItem,
  CommandPaletteLink,
} from './command-palette';
import {
  CalendarIcon,
  ClockIcon,
  GalleryVerticalEndIcon,
  PanelLeftIcon,
} from './icons';
import { PageHeader } from './page-header';
import {
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from './sidebar';
import type { SidebarState } from './sidebar-cookie';
import { TooltipProvider } from './tooltip';

type ShellProps = {
  isApple: boolean;
  sidebarState: SidebarState;
  onAction: () => void;
};

function Shell({ isApple, sidebarState, onAction }: ShellProps) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultState={sidebarState}>
        <Sidebar>
          <SidebarHeader>
            <span className="flex-1 truncate p-1 font-semibold text-foreground">
              Sam Lee
            </span>
            <SidebarTrigger />
          </SidebarHeader>
          <CommandPalette isApple={isApple}>
            <CommandGroup heading="Go to">
              <CommandPaletteLink href="/calendar">
                <CalendarIcon />
                Calendar
              </CommandPaletteLink>
              <CommandPaletteLink href="/practice">
                <GalleryVerticalEndIcon />
                Practice
              </CommandPaletteLink>
              <CommandPaletteLink href="/clock">
                <ClockIcon />
                Clock
              </CommandPaletteLink>
            </CommandGroup>
            <CommandGroup heading="Actions">
              <CommandPaletteItem onSelect={onAction}>
                <PanelLeftIcon />
                Toggle sidebar
              </CommandPaletteItem>
            </CommandGroup>
          </CommandPalette>
        </Sidebar>
        <SidebarInset>
          <PageHeader>
            <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          </PageHeader>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

const meta = {
  title: 'Components/CommandPalette',
  component: Shell,
  args: { isApple: true, sidebarState: 'open', onAction: fn() },
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true, navigation: { pathname: '/calendar' } },
  },
} satisfies Meta<typeof Shell>;

export default meta;

type Story = StoryObj<typeof meta>;

const palette = () =>
  screen.queryByRole('dialog', { name: 'Search and commands' });

const isClosed = () => waitFor(() => expect(palette()).not.toBeInTheDocument());

export const InTheSidebar: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Search' });

    await expect(trigger).toHaveTextContent('Search⌘K');
    await expect(trigger).toHaveAttribute('aria-keyshortcuts', 'Meta+K');
  },
};

export const ShowsCtrlOffApple: Story = {
  args: { isApple: false },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Search' });

    await expect(trigger).toHaveTextContent('SearchCtrl K');
    await expect(trigger).toHaveAttribute('aria-keyshortcuts', 'Control+K');
  },
};

export const TogglesWithCommandOrControlK: Story = {
  play: async ({ userEvent }) => {
    await userEvent.keyboard('{Meta>}k{/Meta}');
    await expect(palette()).toBeInTheDocument();
    await userEvent.keyboard('{Meta>}k{/Meta}');
    await isClosed();

    await userEvent.keyboard('{Control>}k{/Control}');
    await expect(palette()).toBeInTheDocument();
    await userEvent.keyboard('{Control>}k{/Control}');
    await isClosed();
  },
};

export const LeavesOtherKShortcutsAlone: Story = {
  play: async ({ userEvent }) => {
    await userEvent.keyboard('{Meta>}{Shift>}k{/Shift}{/Meta}');
    await expect(palette()).not.toBeInTheDocument();

    await userEvent.keyboard('{Control>}{Alt>}k{/Alt}{/Control}');
    await expect(palette()).not.toBeInTheDocument();
  },
};

export const GoesToASection: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Search' });

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('option', { name: 'Practice' }));

    await isClosed();
    await expect(getRouter().push).toHaveBeenCalledOnce();
    await expect(getRouter().push).toHaveBeenLastCalledWith('/practice');
    await expect(trigger).toHaveFocus();
  },
};

export const GoesToASectionFromTheKeyboard: Story = {
  play: async ({ userEvent }) => {
    await userEvent.keyboard('{Meta>}k{/Meta}');
    await userEvent.keyboard('clo{Enter}');

    await isClosed();
    await expect(getRouter().push).toHaveBeenCalledOnce();
    await expect(getRouter().push).toHaveBeenLastCalledWith('/clock');
  },
};

export const LeavesAHiddenSidebarHidden: Story = {
  args: { sidebarState: 'closed' },
  play: async ({ canvasElement, userEvent }) => {
    const sidebar = canvasElement.querySelector('aside');

    await userEvent.keyboard('{Meta>}k{/Meta}');
    await expect(palette()).toBeInTheDocument();
    await expect(sidebar).not.toBeVisible();

    await userEvent.keyboard('{Escape}');
    await isClosed();
    await expect(sidebar).not.toBeVisible();
  },
};

export const RunsAnAction: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.keyboard('{Meta>}k{/Meta}');
    await userEvent.keyboard('sidebar{Enter}');

    await isClosed();
    await expect(args.onAction).toHaveBeenCalledOnce();
  },
};
