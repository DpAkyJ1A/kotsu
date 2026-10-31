import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, useState } from 'react';
import { expect, fn, screen, waitFor } from 'storybook/test';

import {
  CommandDialog,
  CommandDialogContent,
  CommandDialogTrigger,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from './command';
import {
  CalendarIcon,
  ClockIcon,
  ContrastIcon,
  FileTextIcon,
  GalleryVerticalEndIcon,
  LibraryIcon,
  PanelLeftIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SheetIcon,
} from './icons';
import { Kbd } from './kbd';
import { Textarea } from './textarea';

const GROUPS = [
  {
    heading: 'Go to',
    items: [
      { name: 'Calendar', icon: CalendarIcon },
      { name: 'Practice', icon: GalleryVerticalEndIcon },
      { name: 'Clock', icon: ClockIcon },
      { name: 'Settings', icon: SettingsIcon, shortcut: '⌘,' },
    ],
  },
  {
    heading: 'Shelves and docs',
    items: [
      { name: 'Spanish', icon: LibraryIcon },
      { name: 'Spanish verbs', icon: FileTextIcon },
      { name: 'Guitar', icon: LibraryIcon },
      { name: 'Chord changes', icon: FileTextIcon },
      { name: 'Running log', icon: SheetIcon },
    ],
  },
  {
    heading: 'Actions',
    items: [
      { name: 'New doc', icon: PlusIcon },
      { name: 'New event', icon: PlusIcon },
      { name: 'Start “Daily mix”', icon: PlayIcon },
      { name: 'Toggle theme', icon: ContrastIcon, keywords: ['dark', 'light'] },
      { name: 'Toggle sidebar', icon: PanelLeftIcon, shortcut: '⌘\\' },
    ],
  },
];

type CommandPaletteProps = {
  defaultOpen?: boolean;
  onRun: (command: string) => void;
};

// The palette as the shell will wire it: ⌘K or Ctrl+K toggles it from anywhere on the page, the search field in
// the sidebar opens it, and an item runs and closes it
function CommandPalette({ defaultOpen = false, onRun }: CommandPaletteProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [lastRun, setLastRun] = useState('nothing yet');

  useEffect(() => {
    const toggle = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    document.addEventListener('keydown', toggle);
    return () => {
      document.removeEventListener('keydown', toggle);
    };
  }, []);

  const run = (command: string) => {
    setOpen(false);
    setLastRun(command);
    onRun(command);
  };

  return (
    <div className="flex w-64 flex-col gap-4 text-sm">
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandDialogTrigger className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
          <SearchIcon />
          Search
          <Kbd className="ml-auto">⌘K</Kbd>
        </CommandDialogTrigger>
        <CommandDialogContent title="Search and commands">
          <CommandInput placeholder="Search or run a command" />
          <CommandList label="Results">
            <CommandEmpty>No results</CommandEmpty>
            {GROUPS.map(({ heading, items }) => (
              <CommandGroup key={heading} heading={heading}>
                {items.map(({ name, icon: Icon, shortcut, keywords }) => (
                  <CommandItem
                    key={name}
                    keywords={keywords ?? []}
                    onSelect={() => {
                      run(name);
                    }}
                  >
                    <Icon />
                    {name}
                    {shortcut && <CommandShortcut>{shortcut}</CommandShortcut>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </CommandDialogContent>
      </CommandDialog>
      <label className="flex flex-col gap-1.5 font-semibold">
        Note for today
        <Textarea defaultValue="Twenty verbs, the irregular ones twice." />
      </label>
      <p role="status" className="font-semibold">
        Ran: {lastRun}
      </p>
    </div>
  );
}

const meta = {
  title: 'Components/Command',
  component: CommandPalette,
  args: { onRun: fn() },
  parameters: {
    a11y: {
      config: {
        // As with Dialog: while the palette is open, axe sees the trigger focusable under aria-hidden
        rules: [{ id: 'aria-hidden-focus', enabled: false }],
      },
    },
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { defaultOpen: true },
};

const option = (name: string | RegExp) => screen.getByRole('option', { name });

const isClosed = () =>
  waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

// ⌘K opens the palette from the note with the first item highlighted; arrows move the highlight while the focus
// stays in the field, typing filters the items and hides the groups left empty, and Enter runs the highlighted
// item. Ctrl+K opens it again with an empty search; Escape closes it without a run. Each time the focus goes back
// to the note
export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const note = canvas.getByRole('textbox', { name: 'Note for today' });

    await userEvent.click(note);
    await userEvent.keyboard('{Meta>}k{/Meta}');
    await screen.findByRole('dialog', { name: 'Search and commands' });
    const input = screen.getByRole('combobox', { name: 'Search and commands' });
    await expect(input).toHaveFocus();
    await expect(option('Calendar')).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect(option('Clock')).toHaveAttribute('aria-selected', 'true');
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      option('Clock').id,
    );
    await userEvent.keyboard('{ArrowUp}');
    await expect(option('Practice')).toHaveAttribute('aria-selected', 'true');
    await expect(option('Clock')).toHaveAttribute('aria-selected', 'false');
    await userEvent.tab();
    await expect(input).toHaveFocus();

    await userEvent.keyboard('verbs');
    await expect(screen.getAllByRole('option')).toHaveLength(1);
    await expect(option('Spanish verbs')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(
      screen.queryByRole('group', { name: 'Go to' }),
    ).not.toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    await isClosed();
    await expect(args.onRun).toHaveBeenCalledOnce();
    await expect(args.onRun).toHaveBeenLastCalledWith('Spanish verbs');
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Ran: Spanish verbs',
    );
    await expect(note).toHaveFocus();

    await userEvent.keyboard('{Control>}k{/Control}');
    await screen.findByRole('dialog');
    await expect(screen.getByRole('combobox')).toHaveValue('');
    await userEvent.keyboard('dark');
    await expect(option('Toggle theme')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.keyboard('{Backspace>4/}xyz');
    await expect(screen.getByText('No results')).toBeVisible();
    await expect(screen.queryAllByRole('option')).toHaveLength(0);
    await userEvent.keyboard('{Escape}');
    await isClosed();
    await expect(note).toHaveFocus();
    await expect(args.onRun).toHaveBeenCalledOnce();
  },
};

// The pointer highlights the row it moves over and a click runs it; a click on the overlay closes the palette
// without a run. The focus goes back to the trigger
export const Pointer: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /Search/ });

    await userEvent.click(trigger);
    await screen.findByRole('dialog');
    await userEvent.hover(option('Guitar'));
    await expect(option('Guitar')).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(option(/^Settings/));
    await isClosed();
    await expect(args.onRun).toHaveBeenCalledOnce();
    await expect(args.onRun).toHaveBeenLastCalledWith('Settings');
    await expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await screen.findByRole('dialog');
    // The overlay has no role to find it by
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    await expect(overlay).toBeInTheDocument();
    if (overlay) await userEvent.click(overlay);
    await isClosed();
    await expect(args.onRun).toHaveBeenCalledOnce();
    await expect(trigger).toHaveFocus();
  },
};
