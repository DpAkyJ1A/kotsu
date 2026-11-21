import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import { expect, mocked, screen, waitFor, within } from 'storybook/test';

import { toast, Toaster } from '@/ui/toast';

import {
  createItemAction,
  moveItemAction,
  moveShelfAction,
  renameItemAction,
} from '../actions';
import type { Item } from '../core/item';
import type { Shelf } from '../core/shelf';
import {
  ShelvesFromServer,
  startShelfServer,
} from './shelf-server-for-stories';
import { ShelfTree } from './shelf-tree';

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

const READING: Shelf = {
  id: '019a9c3e-0004-7000-8000-000000000004',
  name: 'Reading & listening',
  color: 'green',
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
const PODCASTS: Item = {
  id: '019a9c3e-0401-7000-8000-000000000401',
  shelfId: READING.id,
  kind: 'doc',
  title: 'Podcasts and radio',
};

function isCut(text: HTMLElement) {
  return text.scrollWidth > text.clientWidth;
}

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

async function waitForMoveInstructions(handle: HTMLElement) {
  await waitFor(() =>
    expect(handle).toHaveAccessibleDescription(
      'Press Space to pick it up, the up and down arrows to move it, Space again to drop it, or Escape to cancel.',
    ),
  );
}

type ShelfTreeStoryArgs = {
  collapsed: string[];
  shelves: Shelf[];
  items: Item[];
};

const meta = {
  title: 'Shelves/ShelfTree',
  component: ShelfTree,
  args: { collapsed: [], shelves: [SPANISH, GUITAR, RUNNING], items: [] },
  parameters: { nextjs: { appDirectory: true } },
  render: ({ collapsed }) => <ShelfTree collapsed={collapsed} />,
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
      document.cookie = 'collapsed-shelves=; path=/; max-age=0';
    };
  },
} satisfies Meta<ShelfTreeStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { items: [VERBS, CHORDS, SCALES] } };

export const InRussian: Story = {
  args: { items: [VERBS, CHORDS, SCALES] },
  globals: { locale: 'ru' },
};

export const ShowsDocsUnderTheirShelf: Story = {
  args: { items: [VERBS, CHORDS, SCALES] },
  play: async ({ canvas }) => {
    const guitar = canvas.getByRole('link', { name: 'Guitar' }).closest('li');
    if (!guitar) throw new Error('Guitar must be a list item');

    await expect(
      within(guitar)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Guitar', 'Chords', 'Scales']);
    const toggle = canvas.getByRole('button', { name: 'Docs on Guitar' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(
      document.getElementById(toggle.getAttribute('aria-controls') ?? ''),
    ).toContainElement(canvas.getByRole('link', { name: 'Chords' }));
    await expect(
      canvas.queryByRole('button', { name: 'Docs on Running' }),
    ).toBeNull();
  },
};

export const GivesANameTheWholeRowUntilItsButtonsShow: Story = {
  args: { shelves: [READING], items: [PODCASTS] },
  play: async ({ canvas }) => {
    for (const name of [READING.name, PODCASTS.title]) {
      const row = canvas.getByRole('link', { name });
      const text = within(row).getByText(name);
      const options = canvas.getByRole('button', {
        name: `Options for ${name}`,
      });
      await expect(isCut(text)).toBe(false);
      await expect(options).not.toBeVisible();

      row.focus();
      await expect(options).toBeVisible();
      await expect(isCut(text)).toBe(true);
      row.blur();
    }
  },
};

export const FoldsAShelfAndRemembersItOnThisDevice: Story = {
  args: { items: [VERBS, CHORDS, SCALES] },
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole('button', { name: 'Docs on Guitar' });
    await userEvent.click(toggle);

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).not.toHaveAttribute('aria-controls');
    await expect(canvas.queryByRole('link', { name: 'Chords' })).toBeNull();
    await expect(canvas.getByRole('link', { name: 'Verbs' })).toBeVisible();
    await expect(document.cookie).toContain(`collapsed-shelves=${GUITAR.id}`);

    await userEvent.click(toggle);
    await expect(canvas.getByRole('link', { name: 'Chords' })).toBeVisible();
    await expect(document.cookie).not.toContain(GUITAR.id);
  },
};

export const StartsWithTheShelvesFoldedBefore: Story = {
  args: { items: [VERBS, CHORDS], collapsed: [GUITAR.id] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('link', { name: 'Chords' })).toBeNull();
    await expect(canvas.getByRole('link', { name: 'Verbs' })).toBeVisible();
  },
};

export const MakesADocFromTheRowOfAShelf: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'New doc on Running' }),
    );
    const form = await screen.findByRole('dialog', { name: 'New doc' });
    await waitFor(() =>
      expect(
        within(form).getByRole('textbox', { name: 'Doc title' }),
      ).toHaveFocus(),
    );
    await userEvent.keyboard('Intervals{Enter}');

    await expect(createItemAction).toHaveBeenCalledOnce();
    const [created] = mocked(createItemAction).mock.lastCall ?? [];
    await expect(created).toMatchObject({
      shelfId: RUNNING.id,
      kind: 'doc',
      title: 'Intervals',
    });
    await waitFor(() =>
      expect(getRouter().push).toHaveBeenLastCalledWith(
        `/docs/${created?.id ?? ''}`,
      ),
    );
    await expect(canvas.getByRole('link', { name: 'Intervals' })).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'New doc on Running' }),
    ).not.toHaveFocus();
  },
};

export const OpensAFoldedShelfOnceADocIsMadeOnIt: Story = {
  args: { items: [CHORDS], collapsed: [GUITAR.id] },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'New doc on Guitar' }),
    );
    await screen.findByRole('dialog', { name: 'New doc' });
    await userEvent.keyboard('Arpeggios{Enter}');

    await expect(
      await canvas.findByRole('link', { name: 'Arpeggios' }),
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Chords' })).toBeVisible();
    await expect(document.cookie).not.toContain(GUITAR.id);
  },
};

export const RenamesADocOnADoubleClickInTheTree: Story = {
  args: { items: [CHORDS] },
  play: async ({ canvas, userEvent }) => {
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Chords' }));

    const title = canvas.getByRole('textbox', { name: 'Doc title' });
    await expect(title).toHaveFocus();
    await expect(title).toHaveProperty('selectionStart', 'Chords'.length);
    await userEvent.keyboard(' and triads{Enter}');

    await expect(renameItemAction).toHaveBeenCalledOnce();
    await expect(renameItemAction).toHaveBeenLastCalledWith({
      id: CHORDS.id,
      title: 'Chords and triads',
    });
    await expect(
      canvas.getByRole('link', { name: 'Chords and triads' }),
    ).toHaveFocus();
  },
};

export const LeavesThePageOfADeletedDocForItsShelf: Story = {
  args: { items: [CHORDS, SCALES] },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: `/docs/${CHORDS.id}` },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Chords' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Delete' }),
    );

    await expect(getRouter().replace).toHaveBeenLastCalledWith(
      `/shelves/${GUITAR.id}`,
    );
    await expect(canvas.queryByRole('link', { name: 'Chords' })).toBeNull();
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }));
    await expect(canvas.getByRole('link', { name: 'Chords' })).toBeVisible();
  },
};

export const StaysOnThePageOfADocWhenAnotherIsDeleted: Story = {
  args: { items: [CHORDS, SCALES] },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: `/docs/${CHORDS.id}` },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Scales' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Delete' }),
    );

    await expect(canvas.queryByRole('link', { name: 'Scales' })).toBeNull();
    await expect(getRouter().replace).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }));
    await expect(canvas.getByRole('link', { name: 'Scales' })).toBeVisible();
  },
};

export const MovesADocDownItsShelfWithTheKeyboard: Story = {
  args: { items: [VERBS, CHORDS, SCALES] },
  play: async ({ canvas, userEvent }) => {
    const handle = canvas.getByRole('button', { name: 'Move Chords' });
    await waitForMoveInstructions(handle);
    canvas.getByRole('link', { name: 'Chords' }).focus();
    await userEvent.tab();
    await expect(handle).toHaveFocus();

    await userEvent.keyboard(' ');
    await expectAnnounced('Picked up Chords. Position 1 of 2 on Guitar.');
    await userEvent.keyboard('{ArrowDown}');
    await expectAnnounced('Chords: position 2 of 2 on Guitar.');
    await userEvent.keyboard(' ');
    await expectAnnounced('Chords dropped at position 2 of 2 on Guitar.');

    await waitFor(() => expect(moveItemAction).toHaveBeenCalledOnce());
    await expect(moveItemAction).toHaveBeenLastCalledWith({
      id: CHORDS.id,
      shelfId: GUITAR.id,
      after: SCALES.id,
    });
    await expect(
      canvas.getAllByRole('link').map((link) => link.textContent),
    ).toEqual(['Spanish', 'Verbs', 'Guitar', 'Scales', 'Chords', 'Running']);
  },
};

export const MovesADocToTheEndOfAnotherShelfWithTheKeyboard: Story = {
  args: { items: [VERBS, CHORDS] },
  play: async ({ canvas, userEvent }) => {
    const handle = canvas.getByRole('button', { name: 'Move Verbs' });
    await waitForMoveInstructions(handle);
    canvas.getByRole('link', { name: 'Verbs' }).focus();
    await userEvent.tab();
    await expect(handle).toHaveFocus();

    await userEvent.keyboard(' ');
    await expectAnnounced('Picked up Verbs. Position 1 of 1 on Spanish.');
    await userEvent.keyboard('{ArrowDown}');
    await expectAnnounced('Verbs: to the end of Guitar.');
    await userEvent.keyboard(' ');
    await expectAnnounced('Verbs moved to the end of Guitar.');

    await waitFor(() => expect(moveItemAction).toHaveBeenCalledOnce());
    await expect(moveItemAction).toHaveBeenLastCalledWith({
      id: VERBS.id,
      shelfId: GUITAR.id,
      after: CHORDS.id,
    });
    await expect(
      canvas.getAllByRole('link').map((link) => link.textContent),
    ).toEqual(['Spanish', 'Guitar', 'Chords', 'Verbs', 'Running']);
  },
};

export const MovesADocBetweenTheDocsOfAnotherShelfWithTheKeyboard: Story = {
  args: { items: [VERBS, CHORDS, SCALES] },
  play: async ({ canvas, userEvent }) => {
    const handle = canvas.getByRole('button', { name: 'Move Verbs' });
    await waitForMoveInstructions(handle);
    canvas.getByRole('link', { name: 'Verbs' }).focus();
    await userEvent.tab();
    await expect(handle).toHaveFocus();

    await userEvent.keyboard(' ');
    await expectAnnounced('Picked up Verbs. Position 1 of 1 on Spanish.');
    await userEvent.keyboard('{ArrowDown}');
    await expectAnnounced('Verbs: to the end of Guitar.');
    await userEvent.keyboard('{ArrowDown}');
    await expectAnnounced('Verbs: position 1 of 3 on Guitar.');
    await userEvent.keyboard('{ArrowDown}');
    await expectAnnounced('Verbs: position 2 of 3 on Guitar.');
    await userEvent.keyboard(' ');
    await expectAnnounced('Verbs dropped at position 2 of 3 on Guitar.');

    await waitFor(() => expect(moveItemAction).toHaveBeenCalledOnce());
    await expect(moveItemAction).toHaveBeenLastCalledWith({
      id: VERBS.id,
      shelfId: GUITAR.id,
      after: CHORDS.id,
    });
    await expect(
      canvas.getAllByRole('link').map((link) => link.textContent),
    ).toEqual(['Spanish', 'Guitar', 'Chords', 'Verbs', 'Scales', 'Running']);
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Move Verbs' })).toHaveFocus(),
    );
  },
};

export const OpensAFoldedShelfOnceADocLandsOnIt: Story = {
  args: { items: [VERBS, CHORDS], collapsed: [GUITAR.id] },
  play: async ({ canvas, userEvent }) => {
    const handle = canvas.getByRole('button', { name: 'Move Verbs' });
    await waitForMoveInstructions(handle);
    canvas.getByRole('link', { name: 'Verbs' }).focus();
    await userEvent.tab();
    await expect(handle).toHaveFocus();

    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowDown}');
    await expectAnnounced('Verbs: to the end of Guitar.');
    await userEvent.keyboard(' ');
    await expectAnnounced('Verbs moved to the end of Guitar.');

    await expect(
      canvas.getByRole('button', { name: 'Docs on Guitar' }),
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(
      canvas.getAllByRole('link').map((link) => link.textContent),
    ).toEqual(['Spanish', 'Guitar', 'Chords', 'Verbs', 'Running']);
    await expect(document.cookie).not.toContain(GUITAR.id);
  },
};

export const PutsADocBackWhenItsMoveIsCancelled: Story = {
  args: { items: [VERBS, CHORDS] },
  play: async ({ canvas, userEvent }) => {
    const handle = canvas.getByRole('button', { name: 'Move Verbs' });
    await waitForMoveInstructions(handle);
    canvas.getByRole('link', { name: 'Verbs' }).focus();
    await userEvent.tab();
    await expect(handle).toHaveFocus();
    await userEvent.keyboard(' ');
    await expectAnnounced('Picked up Verbs. Position 1 of 1 on Spanish.');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Escape}');
    await expectAnnounced(
      'Move cancelled. Verbs is back at position 1 of 1 on Spanish.',
    );

    await expect(moveItemAction).not.toHaveBeenCalled();
    await expect(
      canvas.getAllByRole('link').map((link) => link.textContent),
    ).toEqual(['Spanish', 'Verbs', 'Guitar', 'Chords', 'Running']);
  },
};

export const MovesAShelfWithItsDocsWithTheKeyboard: Story = {
  args: { items: [VERBS, CHORDS] },
  play: async ({ canvas, userEvent }) => {
    const handle = canvas.getByRole('button', { name: 'Move Spanish' });
    await waitForMoveInstructions(handle);
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
    ).toEqual(['Guitar', 'Chords', 'Spanish', 'Verbs', 'Running']);
  },
};

export const LeavesADocWhereItIsWhenDroppedOnItsOwnShelf: Story = {
  args: { items: [VERBS, CHORDS] },
  play: async ({ canvas, userEvent }) => {
    const handle = canvas.getByRole('button', { name: 'Move Verbs' });
    await waitForMoveInstructions(handle);
    canvas.getByRole('link', { name: 'Verbs' }).focus();
    await userEvent.tab();
    await expect(handle).toHaveFocus();

    await userEvent.keyboard(' ');
    await expectAnnounced('Picked up Verbs. Position 1 of 1 on Spanish.');
    await userEvent.keyboard('{ArrowUp}');
    await userEvent.keyboard(' ');
    await expectAnnounced('Verbs dropped at position 1 of 1 on Spanish.');

    await expect(moveItemAction).not.toHaveBeenCalled();
    await expect(
      canvas.getAllByRole('link').map((link) => link.textContent),
    ).toEqual(['Spanish', 'Verbs', 'Guitar', 'Chords', 'Running']);
  },
};

export const SendsNothingWhenADocEndsWhereItWas: Story = {
  args: { items: [VERBS, CHORDS, SCALES] },
  play: async ({ canvas, userEvent }) => {
    const handle = canvas.getByRole('button', { name: 'Move Chords' });
    await waitForMoveInstructions(handle);
    canvas.getByRole('link', { name: 'Chords' }).focus();
    await userEvent.tab();
    await expect(handle).toHaveFocus();

    await userEvent.keyboard(' ');
    await expectAnnounced('Picked up Chords. Position 1 of 2 on Guitar.');
    await userEvent.keyboard('{ArrowDown}');
    await expectAnnounced('Chords: position 2 of 2 on Guitar.');
    await waitFor(() =>
      expect(
        canvas.getAllByRole('link').map((link) => link.textContent),
      ).toEqual(['Spanish', 'Verbs', 'Guitar', 'Scales', 'Chords', 'Running']),
    );
    await userEvent.keyboard('{ArrowUp}');
    await expectAnnounced('Chords: position 1 of 2 on Guitar.');
    await userEvent.keyboard(' ');
    await expectAnnounced('Chords dropped at position 1 of 2 on Guitar.');

    await expect(moveItemAction).not.toHaveBeenCalled();
    await expect(
      canvas.getAllByRole('link').map((link) => link.textContent),
    ).toEqual(['Spanish', 'Verbs', 'Guitar', 'Chords', 'Scales', 'Running']);
  },
};
