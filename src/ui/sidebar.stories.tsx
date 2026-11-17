import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, waitFor, within } from 'storybook/test';

import { CalendarIcon, ClockIcon, GalleryVerticalEndIcon } from './icons';
import { PageHeader } from './page-header';
import {
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarLink,
  SidebarNav,
  SidebarProvider,
  SidebarTrigger,
} from './sidebar';
import type { SidebarState } from './sidebar-cookie';
import { TooltipProvider } from './tooltip';

type ShellProps = { defaultState: SidebarState };

function Shell({ defaultState }: ShellProps) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultState={defaultState}>
        <Sidebar>
          <SidebarHeader>
            <span className="flex-1 truncate p-1 font-semibold text-foreground">
              Sam Lee
            </span>
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarNav>
            <SidebarLink href="/calendar">
              <CalendarIcon />
              Calendar
            </SidebarLink>
            <SidebarLink href="/practice">
              <GalleryVerticalEndIcon />
              Practice
            </SidebarLink>
            <SidebarLink href="/clock">
              <ClockIcon />
              Clock
            </SidebarLink>
          </SidebarNav>
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

function sidebarOf(canvasElement: HTMLElement) {
  const sidebar = canvasElement.querySelector('aside');
  if (!sidebar) throw new Error('No sidebar on the page');
  return sidebar;
}

function pageOf(canvasElement: HTMLElement) {
  const page = canvasElement.querySelector('main');
  if (!page) throw new Error('No page next to the sidebar');
  return within(page);
}

const meta = {
  title: 'Components/Sidebar',
  component: Shell,
  args: { defaultState: 'open' },
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true, navigation: { pathname: '/calendar' } },
  },
  beforeEach: () => {
    document.cookie = 'sidebar=; path=/; max-age=0';
  },
} satisfies Meta<typeof Shell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: 'Calendar' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      canvas.getByRole('link', { name: 'Practice' }),
    ).not.toHaveAttribute('aria-current');
    await expect(
      canvas.queryByRole('button', { name: 'Open sidebar' }),
    ).not.toBeInTheDocument();
  },
};

export const Closed: Story = {
  args: { defaultState: 'closed' },
  play: async ({ canvasElement }) => {
    await expect(sidebarOf(canvasElement)).not.toBeVisible();
  },
};

export const ClosesAndOpensWithTheButtons: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const sidebar = sidebarOf(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Close sidebar' }),
    );
    await waitFor(() => expect(sidebar).not.toBeVisible());
    await expect(document.cookie).toContain('sidebar=closed');

    await userEvent.click(canvas.getByRole('button', { name: 'Open sidebar' }));
    await waitFor(() => expect(sidebar).toBeVisible());
    await expect(document.cookie).toContain('sidebar=open');
  },
};

export const TogglesWithCommandOrControlBackslash: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const sidebar = sidebarOf(canvasElement);

    await userEvent.keyboard('{Meta>}[Backslash]{/Meta}');
    await waitFor(() => expect(sidebar).not.toBeVisible());

    await userEvent.keyboard('{Control>}[Backslash]{/Control}');
    await waitFor(() => expect(sidebar).toBeVisible());
  },
};

export const LeavesOtherBackslashShortcutsAlone: Story = {
  play: async ({ canvasElement, userEvent }) => {
    await userEvent.keyboard('{Meta>}{Shift>}[Backslash]{/Shift}{/Meta}');
    await userEvent.keyboard('{Control>}{Alt>}[Backslash]{/Alt}{/Control}');

    await expect(sidebarOf(canvasElement)).toHaveAttribute(
      'data-state',
      'open',
    );
  },
};

export const LeavesAShortcutThePageHasHandled: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const link = canvas.getByRole('link', { name: 'Calendar' });
    link.addEventListener('keydown', (event) => {
      event.preventDefault();
    });

    link.focus();
    await userEvent.keyboard('{Meta>}[Backslash]{/Meta}');

    await expect(sidebarOf(canvasElement)).toHaveAttribute(
      'data-state',
      'open',
    );
  },
};

export const KeepsKeyboardFocusOnAButtonThatStays: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const sidebarElement = sidebarOf(canvasElement);
    const sidebar = within(sidebarElement);
    const page = pageOf(canvasElement);

    await userEvent.tab();
    await expect(
      sidebar.getByRole('button', { name: 'Close sidebar' }),
    ).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(
      page.getByRole('button', { name: 'Open sidebar' }),
    ).toHaveFocus();
    await waitFor(() => expect(sidebarElement).not.toBeVisible());

    await userEvent.keyboard('{Enter}');
    await expect(
      sidebar.getByRole('button', { name: 'Close sidebar' }),
    ).toHaveFocus();

    await userEvent.tab();
    await expect(sidebar.getByRole('link', { name: 'Calendar' })).toHaveFocus();
    await userEvent.keyboard('{Meta>}[Backslash]{/Meta}');
    await expect(
      page.getByRole('button', { name: 'Open sidebar' }),
    ).toHaveFocus();
  },
};

export const ShowsTheShortcutInTheTooltip: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();

    await expect(
      canvas.getByRole('button', { name: 'Close sidebar' }),
    ).toHaveFocus();
    await expect(await screen.findByRole('tooltip')).toHaveTextContent(
      /^Close sidebar(⌘|Ctrl )\\$/,
    );
  },
};
