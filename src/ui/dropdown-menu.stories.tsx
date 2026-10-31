import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, screen, waitFor } from 'storybook/test';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { IconButton } from './icon-button';
import {
  ChevronDownIcon,
  ContrastIcon,
  EllipsisIcon,
  LibraryIcon,
  LogOutIcon,
  MoonIcon,
  PencilIcon,
  SettingsIcon,
  SunIcon,
  Trash2Icon,
} from './icons';

type NameMenuProps = {
  defaultOpen?: boolean;
  onThemeChange: (theme: string) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
};

// The menu under your name in the sidebar, as in the settings mockup
function NameMenu({
  defaultOpen = false,
  onThemeChange,
  onOpenSettings,
  onSignOut,
}: NameMenuProps) {
  const [theme, setTheme] = useState('auto');

  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <DropdownMenu defaultOpen={defaultOpen}>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
          <span className="grid size-6 place-items-center rounded-full bg-violet text-xs text-violet-foreground">
            SL
          </span>
          Sam Lee
          <ChevronDownIcon className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel className="flex flex-col text-sm text-foreground">
            Sam Lee
            <span className="text-xs font-normal text-muted-foreground">
              sam@example.com
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value) => {
              setTheme(value);
              onThemeChange(value);
            }}
          >
            <DropdownMenuRadioItem value="light">
              <SunIcon />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <MoonIcon />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="auto">
              <ContrastIcon />
              Auto
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onOpenSettings}>
            <SettingsIcon />
            Settings
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onSignOut}>
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="font-semibold">
        Theme: {theme}
      </p>
    </div>
  );
}

const meta = {
  title: 'Components/DropdownMenu',
  component: NameMenu,
  args: {
    onThemeChange: fn(),
    onOpenSettings: fn(),
    onSignOut: fn(),
  },
  parameters: {
    a11y: {
      config: {
        // As with Dialog: while the menu is open, axe sees the trigger focusable under aria-hidden
        rules: [{ id: 'aria-hidden-focus', enabled: false }],
      },
    },
  },
} satisfies Meta<typeof NameMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { defaultOpen: true },
};

// Enter opens the menu on its first item; arrows and a first letter move, Tab stays inside, Enter picks and
// closes, and Escape closes without a pick; each time the focus goes back to the trigger
export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /Sam Lee/ });
    const radio = (name: string) => screen.getByRole('menuitemradio', { name });

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect(await screen.findByRole('menu')).toBeInTheDocument();
    await expect(radio('Light')).toHaveFocus();
    await expect(radio('Auto')).toBeChecked();

    await userEvent.keyboard('{ArrowDown}');
    await expect(radio('Dark')).toHaveFocus();
    await userEvent.tab();
    await expect(radio('Dark')).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await expect(args.onThemeChange).toHaveBeenCalledOnce();
    await expect(args.onThemeChange).toHaveBeenLastCalledWith('dark');
    await expect(trigger).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('s');
    await expect(
      screen.getByRole('menuitem', { name: /^Settings/ }),
    ).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
    await expect(args.onOpenSettings).not.toHaveBeenCalled();
    await expect(canvas.getByRole('status')).toHaveTextContent('Theme: dark');
  },
};

type ItemActionsProps = {
  onRename: () => void;
  onMove: (shelf: string) => void;
  onDelete: () => void;
};

// The actions of a doc on its shelf: a submenu and a destructive item
function ItemActions({ onRename, onMove, onDelete }: ItemActionsProps) {
  const [shelf, setShelf] = useState('spanish');

  return (
    <div className="flex items-center gap-2 text-sm font-semibold">
      Verbs
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton label="Actions for Verbs" size="sm">
            <EllipsisIcon />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={onRename}>
            <PencilIcon />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <LibraryIcon />
              Move to
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={shelf}
                onValueChange={(value) => {
                  setShelf(value);
                  onMove(value);
                }}
              >
                <DropdownMenuRadioItem value="spanish">
                  Spanish
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="guitar">
                  Guitar
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="running">
                  Running
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const WithSubmenu: StoryObj<Meta<typeof ItemActions>> = {
  args: { onRename: fn(), onMove: fn(), onDelete: fn() },
  render: (args) => <ItemActions {...args} />,
};

// ArrowRight opens the submenu on its first item, ArrowLeft closes it and returns to "Move to"
export const SubmenuKeyboard: StoryObj<Meta<typeof ItemActions>> = {
  ...WithSubmenu,
  play: async ({ args, canvas, userEvent }) => {
    const item = (name: string) => screen.getByRole('menuitem', { name });

    await userEvent.click(
      canvas.getByRole('button', { name: 'Actions for Verbs' }),
    );
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect(item('Move to')).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    const guitar = await screen.findByRole('menuitemradio', {
      name: 'Guitar',
    });
    await waitFor(() =>
      expect(
        screen.getByRole('menuitemradio', { name: 'Spanish' }),
      ).toHaveFocus(),
    );
    await expect(
      screen.getByRole('menuitemradio', { name: 'Spanish' }),
    ).toBeChecked();

    await userEvent.keyboard('{ArrowLeft}');
    await expect(guitar).not.toBeInTheDocument();
    await expect(item('Move to')).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(args.onDelete).toHaveBeenCalledOnce();
    await expect(args.onMove).not.toHaveBeenCalled();
  },
};
