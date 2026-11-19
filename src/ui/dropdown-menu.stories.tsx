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
  DropdownMenuSegmentedGroup,
  DropdownMenuSegmentedItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSwatchGroup,
  DropdownMenuSwatchItem,
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
          <DropdownMenuSegmentedGroup
            aria-label="Theme"
            value={theme}
            onValueChange={(value) => {
              setTheme(value);
              onThemeChange(value);
            }}
          >
            <DropdownMenuSegmentedItem value="light">
              <SunIcon />
              Light
            </DropdownMenuSegmentedItem>
            <DropdownMenuSegmentedItem value="dark">
              <MoonIcon />
              Dark
            </DropdownMenuSegmentedItem>
            <DropdownMenuSegmentedItem value="auto">
              <ContrastIcon />
              Auto
            </DropdownMenuSegmentedItem>
          </DropdownMenuSegmentedGroup>
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
    await expect(radio('Dark')).toBeChecked();
    await expect(radio('Dark')).toHaveFocus();
    await expect(args.onThemeChange).toHaveBeenCalledOnce();
    await expect(args.onThemeChange).toHaveBeenLastCalledWith('dark');
    await userEvent.keyboard('{Escape}');
    await expect(screen.queryByRole('menu')).not.toBeInTheDocument();
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

const SWATCHES = [
  { value: 'violet', label: 'Violet', className: 'bg-violet-foreground' },
  { value: 'blue', label: 'Blue', className: 'bg-blue-foreground' },
  { value: 'teal', label: 'Teal', className: 'bg-teal-foreground' },
  { value: 'amber', label: 'Amber', className: 'bg-amber-foreground' },
];

type ColourMenuProps = { onColourChange: (colour: string) => void };

function ColourMenu({ onColourChange }: ColourMenuProps) {
  const [colour, setColour] = useState('violet');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton label="Options for Spanish">
          <EllipsisIcon />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel id="colour">Colour</DropdownMenuLabel>
        <DropdownMenuSwatchGroup
          aria-labelledby="colour"
          value={colour}
          onValueChange={setColour}
        >
          {SWATCHES.map((swatch) => (
            <DropdownMenuSwatchItem
              key={swatch.value}
              value={swatch.value}
              aria-label={swatch.label}
              textValue={swatch.label}
              className={swatch.className}
              onSelect={() => {
                onColourChange(swatch.value);
              }}
            />
          ))}
        </DropdownMenuSwatchGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const WithSwatches: StoryObj<Meta<typeof ColourMenu>> = {
  args: { onColourChange: fn() },
  render: (args) => <ColourMenu {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    const swatch = (name: string) =>
      screen.getByRole('menuitemradio', { name });

    canvas.getByRole('button', { name: 'Options for Spanish' }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(swatch('Violet')).toHaveFocus());
    await expect(swatch('Violet')).toBeChecked();

    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await expect(swatch('Teal')).toBeChecked();
    await expect(swatch('Teal')).toHaveFocus();
    await expect(args.onColourChange).toHaveBeenCalledOnce();
    await expect(args.onColourChange).toHaveBeenLastCalledWith('teal');
    await userEvent.keyboard('{Escape}');
  },
};
