import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect, mocked, screen, waitFor, within } from 'storybook/test';

import { toast, Toaster } from '@/ui/toast';

import {
  createShelfAction,
  deleteShelfAction,
  moveShelfAction,
  updateShelfAction,
} from '../actions';
import type { Item } from '../core/item';
import type { Shelf } from '../core/shelf';
import { ShelfNav } from './shelf-nav';
import { ShelfScreen } from './shelf-screen';
import {
  ShelvesFromServer,
  startShelfServer,
} from './shelf-server-for-stories';

const SPANISH: Shelf = {
  id: '019a9c3e-0001-7000-8000-000000000001',
  name: 'Spanish',
  color: 'violet',
};
const GUITAR: Shelf = {
  id: '019a9c3e-0002-7000-8000-000000000002',
  name: 'Guitar',
  color: 'blue',
};
const RUNNING: Shelf = {
  id: '019a9c3e-0003-7000-8000-000000000003',
  name: 'Running',
  color: 'amber',
};

const VERBS: Item = {
  id: '019a9c3e-0101-7000-8000-000000000101',
  shelfId: SPANISH.id,
  kind: 'doc',
  title: 'Verbs',
};
const CHORDS: Item = {
  id: '019a9c3e-0201-7000-8000-000000000201',
  shelfId: GUITAR.id,
  kind: 'doc',
  title: 'Chords',
};
const SCALES: Item = {
  id: '019a9c3e-0202-7000-8000-000000000202',
  shelfId: GUITAR.id,
  kind: 'doc',
  title: 'Scales',
};

const UUID_V7 = /^[\da-f]{8}-[\da-f]{4}-7/;

async function expectAnnounced(text: string) {
  await waitFor(() =>
    expect(
      Array.from(
        document.querySelectorAll('[id^="dnd-kit-announcement"]'),
        (region) => region.textContent,
      ),
    ).toContain(text),
  );
}

type ShelfNavStoryArgs = { shelves: Shelf[]; items: Item[] };

const meta = {
  title: 'Shelves/ShelfNav',
  component: ShelfNav,
  args: { shelves: [SPANISH, GUITAR, RUNNING], items: [] },
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <ShelvesFromServer>
        <div className="flex h-96 w-60 flex-col border-r bg-sidebar p-3 text-sm text-sidebar-foreground">
          <Story />
        </div>
        <Toaster />
      </ShelvesFromServer>
    ),
  ],
  beforeEach: ({ args }) => {
    startShelfServer(args);
    return () => {
      toast.dismiss();
    };
  },
} satisfies Meta<ShelfNavStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutShelves: Story = { args: { shelves: [] } };

export const InRussian: Story = { globals: { locale: 'ru' } };

export const CreatesAShelfInTheColourUsedLeast: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'New shelf' }));
    await userEvent.keyboard('  Chess {Enter}');

    await expect(
      await canvas.findByRole('link', { name: 'Chess' }),
    ).toBeVisible();
    await expect(createShelfAction).toHaveBeenCalledOnce();
    const [created] = mocked(createShelfAction).mock.lastCall ?? [];
    await expect(created).toMatchObject({ name: 'Chess', color: 'green' });
    await expect(created?.id).toMatch(UUID_V7);
    await expect(
      canvas.getByRole('button', { name: 'New shelf' }),
    ).toHaveFocus();
  },
};

export const LeavesANewShelfWithEscapeOrAnEmptyName: Story = {
  play: async ({ canvas, userEvent }) => {
    const newShelf = canvas.getByRole('button', { name: 'New shelf' });

    await userEvent.click(newShelf);
    await userEvent.keyboard('Chess{Escape}');
    await userEvent.click(newShelf);
    await userEvent.keyboard('   {Enter}');

    await expect(canvas.queryByRole('textbox')).toBeNull();
    await expect(canvas.getAllByRole('link')).toHaveLength(3);
    await expect(createShelfAction).not.toHaveBeenCalled();
  },
};

export const RenamesAShelf: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Guitar' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Rename' }),
    );
    const name = canvas.getByRole('textbox', { name: 'Shelf name' });
    await waitFor(() => expect(name).toHaveFocus());
    await userEvent.keyboard('Classical guitar{Enter}');

    await expect(updateShelfAction).toHaveBeenCalledOnce();

    await expect(updateShelfAction).toHaveBeenLastCalledWith({
      id: GUITAR.id,
      name: 'Classical guitar',
    });
    await expect(
      canvas.getByRole('link', { name: 'Classical guitar' }),
    ).toHaveFocus();
  },
};

export const RenamesOnADoubleClickWithTheCaretInTheName: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Guitar' }));

    const name = canvas.getByRole('textbox', { name: 'Shelf name' });
    await expect(name).toHaveFocus();
    await expect(name).toHaveProperty('selectionStart', 'Guitar'.length);
    await expect(name).toHaveProperty('selectionEnd', 'Guitar'.length);
    await userEvent.keyboard(' lessons{Enter}');

    await expect(updateShelfAction).toHaveBeenCalledOnce();
    await expect(updateShelfAction).toHaveBeenLastCalledWith({
      id: GUITAR.id,
      name: 'Guitar lessons',
    });
  },
};

export const RecoloursAShelf: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Guitar' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Teal' }),
    );

    await expect(updateShelfAction).toHaveBeenCalledOnce();

    await expect(updateShelfAction).toHaveBeenLastCalledWith({
      id: GUITAR.id,
      color: 'teal',
    });
    await expect(
      screen.getByRole('menuitemradio', { name: 'Teal' }),
    ).toBeChecked();
    await userEvent.keyboard('{Escape}');
  },
};

export const TakesADeletedShelfBackWithUndo: Story = {
  args: { items: [VERBS] },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Guitar' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Delete' }),
    );

    await expect(screen.queryByRole('dialog')).toBeNull();
    await expect(canvas.queryByRole('link', { name: 'Guitar' })).toBeNull();
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }));

    await expect(canvas.getByRole('link', { name: 'Guitar' })).toBeVisible();
    await expect(deleteShelfAction).not.toHaveBeenCalled();
  },
};

export const DeletesAShelfWithDocsOnceItsNameIsTyped: Story = {
  args: { items: [VERBS, CHORDS, SCALES] },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Guitar' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Delete' }),
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Delete Guitar?',
    });
    await expect(dialog).toHaveAccessibleDescription(
      'Its 2 docs will be deleted too:',
    );
    await expect(
      within(dialog)
        .getAllByRole('listitem')
        .map((doc) => doc.textContent),
    ).toEqual(['Chords', 'Scales']);
    const name = within(dialog).getByRole('textbox', {
      name: 'Type Guitar to confirm',
    });
    const confirm = within(dialog).getByRole('button', {
      name: 'Delete shelf',
    });
    await waitFor(() => expect(name).toHaveFocus());
    await expect(confirm).toBeDisabled();

    await userEvent.keyboard('guitar{Enter}');
    await expect(confirm).toBeDisabled();
    await expect(dialog).toBeVisible();
    await userEvent.clear(name);
    await userEvent.keyboard('Guitar');
    await expect(confirm).toBeEnabled();
    await userEvent.click(confirm);

    await expect(screen.queryByRole('dialog')).toBeNull();
    await expect(canvas.queryByRole('link', { name: 'Guitar' })).toBeNull();
    await expect(await screen.findByText('Guitar deleted')).toBeInTheDocument();
    await expect(deleteShelfAction).not.toHaveBeenCalled();
  },
};

export const AsksBeforeDeletingAShelfWhoseDocWaitsForUndo: Story = {
  args: { items: [CHORDS] },
  render: () => (
    <>
      <ShelfNav />
      <ShelfScreen shelfId={GUITAR.id} />
    </>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Chords' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Delete' }),
    );
    await expect(await screen.findByText('Chords deleted')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());

    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Guitar' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Delete' }),
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Delete Guitar?',
    });
    await expect(
      within(dialog)
        .getAllByRole('listitem')
        .map((doc) => doc.textContent),
    ).toEqual(['Chords']);
  },
};

export const LeavesThePageOfADocOnADeletedShelf: Story = {
  args: { items: [CHORDS] },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: `/docs/${CHORDS.id}` },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Guitar' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Delete' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Delete Guitar?',
    });
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Type Guitar to confirm' }),
      'Guitar{Enter}',
    );

    await expect(getRouter().replace).toHaveBeenLastCalledWith('/shelves');
  },
};

export const KeepsAShelfWhenItsDeleteDialogIsCancelled: Story = {
  args: { items: [CHORDS] },
  play: async ({ canvas, userEvent }) => {
    const options = canvas.getByRole('button', { name: 'Options for Guitar' });
    await userEvent.click(options);
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Delete' }),
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Delete Guitar?',
    });
    await expect(dialog).toHaveAccessibleDescription(
      'Its doc will be deleted too:',
    );
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(options).toHaveFocus();
    await expect(canvas.getByRole('link', { name: 'Guitar' })).toBeVisible();
    await expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  },
};

export const MovesAShelfWithTheKeyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    const handle = canvas.getByRole('button', { name: 'Move Spanish' });
    await waitFor(() =>
      expect(handle).toHaveAccessibleDescription(
        'Press Space to pick the shelf up, the up and down arrows to move it, Space again to drop it, or Escape to cancel.',
      ),
    );
    canvas.getByRole('link', { name: 'Spanish' }).focus();
    await userEvent.tab();
    await expect(handle).toHaveFocus();

    await userEvent.keyboard(' ');
    await expectAnnounced('Picked up Spanish. Position 1 of 3.');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard(' ');
    await expectAnnounced('Spanish dropped at position 2 of 3.');

    await waitFor(() => expect(moveShelfAction).toHaveBeenCalledOnce());
    await expect(moveShelfAction).toHaveBeenLastCalledWith({
      id: SPANISH.id,
      after: GUITAR.id,
    });
    await expect(
      canvas.getAllByRole('link').map((link) => link.textContent),
    ).toEqual(['Guitar', 'Spanish', 'Running']);
  },
};

export const ShowsWhyTheServerRefused: Story = {
  beforeEach: () => {
    mocked(updateShelfAction).mockResolvedValue({
      ok: false,
      error: { code: 'NOT_FOUND' },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Guitar' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Rename' }),
    );
    await waitFor(() =>
      expect(canvas.getByRole('textbox', { name: 'Shelf name' })).toHaveFocus(),
    );
    await userEvent.keyboard('Classical guitar{Enter}');

    const failure = (
      await screen.findByText("That's no longer here. Reload the page.")
    ).closest('[data-sonner-toast]');
    await waitFor(() => expect(failure).toHaveStyle({ opacity: '1' }));
    await expect(canvas.getByRole('link', { name: 'Guitar' })).toBeVisible();
  },
};
