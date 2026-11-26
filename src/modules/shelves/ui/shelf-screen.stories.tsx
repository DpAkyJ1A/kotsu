import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import {
  expect,
  fireEvent,
  mocked,
  screen,
  waitFor,
  within,
} from 'storybook/test';

import { toast, Toaster } from '@/ui/toast';

import {
  createItemAction,
  deleteItemAction,
  moveItemAction,
  renameItemAction,
} from '../actions';
import type { Item } from '../core/item';
import type { CardCountsByDoc, Shelf } from '../core/shelf';
import { DOUBLE_CLICK_WAIT_MS } from '../hooks/use-open-unless-double-clicked';
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

function doc(id: string, shelf: Shelf, title: string): Item {
  return { id, shelfId: shelf.id, kind: 'doc', title };
}

const VERBS = doc('019a9c3e-0101-7000-8000-000000000101', SPANISH, 'Verbs');
const KITCHEN = doc(
  '019a9c3e-0102-7000-8000-000000000102',
  SPANISH,
  'Kitchen & food',
);
const TRAVEL = doc(
  '019a9c3e-0103-7000-8000-000000000103',
  SPANISH,
  'Travel phrases for asking the way, buying tickets and checking into a hostel',
);
const NUMBERS = doc(
  '019a9c3e-0104-7000-8000-000000000104',
  SPANISH,
  'Numbers 1–100',
);
const SPANISH_DOCS = [VERBS, KITCHEN, TRAVEL, NUMBERS];
const CARD_COUNTS: CardCountsByDoc = {
  [KITCHEN.id]: { cards: 24, toReview: 8 },
  [TRAVEL.id]: { cards: 1, toReview: 1 },
  [NUMBERS.id]: { cards: 100, toReview: 0 },
};
const CHORDS = doc('019a9c3e-0201-7000-8000-000000000201', GUITAR, 'Chords');

const UUID_V7 = /^[\da-f]{8}-[\da-f]{4}-7/;

type ShelfScreenStoryArgs = {
  shelves: Shelf[];
  items: Item[];
  cardCounts: CardCountsByDoc;
};

const meta = {
  title: 'Shelves/ShelfScreen',
  args: {
    shelves: [SPANISH, GUITAR, RUNNING],
    items: [...SPANISH_DOCS, CHORDS],
    cardCounts: CARD_COUNTS,
  },
  parameters: { nextjs: { appDirectory: true } },
  globals: { viewport: { value: 'desktop' } },
  render: ({ cardCounts }) => (
    <ShelfScreen shelfId={SPANISH.id} cardCounts={cardCounts} />
  ),
  decorators: [
    (Story) => (
      <ShelvesFromServer>
        <Story />
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
} satisfies Meta<ShelfScreenStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OnADesktop: Story = {};

export const OnAPhone: Story = {
  globals: { viewport: { value: 'mobile2' } },
};

export const InRussian: Story = { globals: { locale: 'ru' } };

export const ShowsEachDocsCardsAndHowManyAreToReview: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', {
        name: 'Kitchen & food 24 cards · 8 to review',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', {
        name: /^Travel phrases .* 1 card · 1 to review$/,
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Numbers 1–100 100 cards' }),
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Verbs' })).toBeVisible();
  },
};

export const CountsCardsInRussian: Story = {
  globals: { locale: 'ru' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('24 карточки · 8 повторить')).toBeVisible();
    await expect(canvas.getByText('1 карточка · 1 повторить')).toBeVisible();
    await expect(canvas.getByText('100 карточек')).toBeVisible();
  },
};

export const PutsTheNewDocTileFirst: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')[0]).toContainElement(
      canvas.getByRole('button', { name: 'New doc' }),
    );
  },
};

export const AnEmptyShelf: Story = {
  args: { items: [CHORDS] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Nothing on this shelf yet')).toBeVisible();
    await expect(canvas.queryAllByRole('link')).toHaveLength(0);

    const caption = canvas.getByText('New doc');
    await expect(caption.getBoundingClientRect().width).toBeGreaterThan(1);
  },
};

export const CreatesADocAndOpensIt: Story = {
  play: async ({ canvas, userEvent }) => {
    const newDoc = canvas.getByRole('button', { name: 'New doc' });
    await expect(
      canvas.getByText('New doc').getBoundingClientRect().width,
    ).toBeLessThanOrEqual(1);
    await userEvent.click(newDoc);

    const form = await screen.findByRole('dialog', { name: 'New doc' });
    const title = within(form).getByRole('textbox', { name: 'Doc title' });
    await waitFor(() => expect(title).toHaveFocus());
    await userEvent.keyboard('  Subjunctive {Enter}');

    await expect(createItemAction).toHaveBeenCalledOnce();
    const [created] = mocked(createItemAction).mock.lastCall ?? [];
    await expect(created).toMatchObject({
      shelfId: SPANISH.id,
      kind: 'doc',
      title: 'Subjunctive',
    });
    await expect(created?.id).toMatch(UUID_V7);
    await waitFor(() =>
      expect(getRouter().push).toHaveBeenLastCalledWith(
        `/docs/${created?.id ?? ''}`,
      ),
    );
    await expect(
      canvas.getByRole('link', { name: 'Subjunctive' }),
    ).toBeVisible();
    await expect(screen.queryByRole('dialog')).toBeNull();
  },
};

export const WaitsForTheServerBeforeShowingADoc: Story = {
  play: async ({ canvas, userEvent }) => {
    const answer = Promise.withResolvers<undefined>();
    mocked(createItemAction).mockImplementation(
      async ({ id = crypto.randomUUID(), shelfId, kind, title }) => {
        await answer.promise;
        return { ok: true, data: { id, shelfId, kind, title } };
      },
    );
    await userEvent.click(canvas.getByRole('button', { name: 'New doc' }));
    const form = await screen.findByRole('dialog', { name: 'New doc' });
    const create = within(form).getByRole('button', { name: 'Create' });
    await userEvent.keyboard('Subjunctive{Enter}');

    await waitFor(() => expect(create).toBeDisabled());
    await expect(
      within(form).getByRole('textbox', { name: 'Doc title' }),
    ).toHaveAttribute('readonly');
    await userEvent.keyboard('{Enter}');
    await expect(createItemAction).toHaveBeenCalledOnce();
    await expect(
      canvas.queryByRole('link', { name: 'Subjunctive' }),
    ).toBeNull();
    await expect(getRouter().push).not.toHaveBeenCalled();

    answer.resolve(undefined);
    await waitFor(() => expect(getRouter().push).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const CreatesADocFromADrawerOnAPhone: Story = {
  globals: { viewport: { value: 'mobile2' } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'New doc' }));

    const drawer = await screen.findByRole('dialog', { name: 'New doc' });
    await expect(drawer).toHaveAttribute('data-slot', 'drawer-content');
    await waitFor(() =>
      expect(
        within(drawer).getByRole('textbox', { name: 'Doc title' }),
      ).toHaveFocus(),
    );
    await userEvent.keyboard('Subjunctive');
    await userEvent.click(
      within(drawer).getByRole('button', { name: 'Create' }),
    );

    await expect(createItemAction).toHaveBeenCalledOnce();
    await waitFor(() => expect(getRouter().push).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const CreatesNothingWithoutATitle: Story = {
  play: async ({ canvas, userEvent }) => {
    const newDoc = canvas.getByRole('button', { name: 'New doc' });
    await userEvent.click(newDoc);
    const form = await screen.findByRole('dialog', { name: 'New doc' });
    await waitFor(() =>
      expect(
        within(form).getByRole('textbox', { name: 'Doc title' }),
      ).toHaveFocus(),
    );

    await userEvent.keyboard('   {Enter}');
    await expect(form).toBeVisible();
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(newDoc).toHaveFocus();
    await expect(createItemAction).not.toHaveBeenCalled();
    await userEvent.click(newDoc);
    await expect(
      await screen.findByRole('textbox', { name: 'Doc title' }),
    ).toHaveValue('');
  },
};

export const OpensNoDocTheServerRefused: Story = {
  beforeEach: () => {
    mocked(createItemAction).mockResolvedValue({
      ok: false,
      error: { code: 'NOT_FOUND' },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'New doc' }));
    await screen.findByRole('dialog', { name: 'New doc' });
    await userEvent.keyboard('Subjunctive{Enter}');

    await expect(
      await screen.findByText("That's no longer here. Reload the page."),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(canvas.queryByRole('link', { name: 'Subjunctive' })).toBeNull(),
    );
    await expect(getRouter().push).not.toHaveBeenCalled();
    await expect(
      screen.getByRole('textbox', { name: 'Doc title' }),
    ).toHaveValue('Subjunctive');
  },
};

export const RenamesADoc: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Verbs' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Rename' }),
    );
    const title = canvas.getByRole('textbox', { name: 'Doc title' });
    await waitFor(() => expect(title).toHaveFocus());
    await expect(title).toHaveProperty('selectionStart', 0);
    await expect(title).toHaveProperty('selectionEnd', 'Verbs'.length);
    await userEvent.keyboard('Irregular verbs{Enter}');

    await expect(renameItemAction).toHaveBeenCalledOnce();
    await expect(renameItemAction).toHaveBeenLastCalledWith({
      id: VERBS.id,
      title: 'Irregular verbs',
    });
    await expect(
      canvas.getByRole('link', { name: 'Irregular verbs' }),
    ).toHaveFocus();
  },
};

export const RenamesADocOnADoubleClickOnItsTitle: Story = {
  play: async ({ canvas, userEvent }) => {
    const verbs = canvas.getByRole('link', { name: 'Verbs' });
    await userEvent.dblClick(within(verbs).getByText('Verbs'));

    const title = canvas.getByRole('textbox', { name: 'Doc title' });
    await expect(title).toHaveFocus();
    await expect(title).toHaveProperty('selectionStart', 'Verbs'.length);
    await expect(title).toHaveProperty('selectionEnd', 'Verbs'.length);
    await userEvent.keyboard(' to know{Enter}');

    await expect(renameItemAction).toHaveBeenLastCalledWith({
      id: VERBS.id,
      title: 'Verbs to know',
    });
    await new Promise((resolve) => setTimeout(resolve, DOUBLE_CLICK_WAIT_MS));
    await expect(getRouter().push).not.toHaveBeenCalled();
  },
};

export const OpensADocWhenNoSecondClickFollowsOneOnItsTitle: Story = {
  play: async ({ canvas, userEvent }) => {
    const verbs = canvas.getByRole('link', { name: 'Verbs' });
    await userEvent.click(within(verbs).getByText('Verbs'));

    await expect(getRouter().push).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(getRouter().push).toHaveBeenLastCalledWith(`/docs/${VERBS.id}`),
    );
  },
};

export const KeepsOpeningADocWhenTheSecondClickComesLate: Story = {
  play: async ({ canvas }) => {
    const verbs = canvas.getByRole('link', { name: 'Verbs' });
    const title = within(verbs).getByText('Verbs');
    await fireEvent.click(title, { detail: 1 });
    await waitFor(() => expect(getRouter().push).toHaveBeenCalledOnce());

    await fireEvent.click(title, { detail: 2 });
    await expect(canvas.queryByRole('textbox')).toBeNull();
    await expect(getRouter().push).toHaveBeenCalledOnce();
  },
};

export const OpensADocOnceForTwoSeparateClicksOnItsTitle: Story = {
  play: async ({ canvas }) => {
    const verbs = canvas.getByRole('link', { name: 'Verbs' });
    const title = within(verbs).getByText('Verbs');
    await fireEvent.click(title, { detail: 1 });
    await fireEvent.click(title, { detail: 1 });

    await waitFor(() => expect(getRouter().push).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, DOUBLE_CLICK_WAIT_MS));
    await expect(getRouter().push).toHaveBeenCalledOnce();
  },
};

export const MovesADocToTheEndOfAnotherShelf: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Verbs' }),
    );
    const shelves = await screen.findByRole('group', { name: 'Move to' });
    await expect(
      within(shelves).getByRole('menuitemradio', { name: 'Spanish' }),
    ).toBeChecked();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    await expect(
      within(shelves).getByRole('menuitemradio', { name: 'Guitar' }),
    ).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    await expect(moveItemAction).toHaveBeenCalledOnce();
    await expect(moveItemAction).toHaveBeenLastCalledWith({
      id: VERBS.id,
      shelfId: GUITAR.id,
      after: CHORDS.id,
    });
    await waitFor(() =>
      expect(canvas.queryByRole('link', { name: 'Verbs' })).toBeNull(),
    );
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'New doc' })).toHaveFocus(),
    );
  },
};

export const LeavesADocWhereItIsWhenItsShelfIsPicked: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Verbs' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Spanish' }),
    );

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await expect(moveItemAction).not.toHaveBeenCalled();
    await expect(canvas.getByRole('link', { name: 'Verbs' })).toBeVisible();
  },
};

export const TakesADeletedDocBackWithUndo: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Options for Verbs' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Delete' }),
    );

    await expect(canvas.queryByRole('link', { name: 'Verbs' })).toBeNull();
    await expect(await screen.findByText('Verbs deleted')).toBeInTheDocument();
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'New doc' })).toHaveFocus(),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));

    await expect(canvas.getByRole('link', { name: 'Verbs' })).toBeVisible();
    await expect(deleteItemAction).not.toHaveBeenCalled();
  },
};

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

export const MovesATileWithTheKeyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    const handle = canvas.getByRole('button', { name: 'Move Verbs' });
    await waitFor(() =>
      expect(handle).toHaveAccessibleDescription(
        'Press Space to pick it up, the arrow keys to move it, Space again to drop it, or Escape to cancel.',
      ),
    );
    canvas.getByRole('link', { name: 'Verbs' }).focus();
    await userEvent.tab();
    await expect(handle).toHaveFocus();

    await userEvent.keyboard(' ');
    await expectAnnounced('Picked up Verbs. Position 1 of 4 on Spanish.');
    await userEvent.keyboard('{ArrowRight}');
    await expectAnnounced('Verbs: position 2 of 4 on Spanish.');
    await userEvent.keyboard(' ');
    await expectAnnounced('Verbs dropped at position 2 of 4 on Spanish.');

    await waitFor(() => expect(moveItemAction).toHaveBeenCalledOnce());
    await expect(moveItemAction).toHaveBeenLastCalledWith({
      id: VERBS.id,
      shelfId: SPANISH.id,
      after: SPANISH_DOCS[1]?.id,
    });
    await expect(canvas.getAllByRole('link').slice(0, 2)).toEqual([
      canvas.getByRole('link', { name: /^Kitchen & food/ }),
      canvas.getByRole('link', { name: 'Verbs' }),
    ]);
    await expect(getRouter().push).not.toHaveBeenCalled();
  },
};

export const SendsNothingWhenATileIsDroppedWhereItWas: Story = {
  play: async ({ canvas, userEvent }) => {
    const handle = canvas.getByRole('button', { name: 'Move Verbs' });
    await waitFor(() => expect(handle).toHaveAccessibleDescription());
    canvas.getByRole('link', { name: 'Verbs' }).focus();
    await userEvent.tab();
    await expect(handle).toHaveFocus();

    await userEvent.keyboard(' ');
    await expectAnnounced('Picked up Verbs. Position 1 of 4 on Spanish.');
    await userEvent.keyboard(' ');
    await expectAnnounced('Verbs dropped at position 1 of 4 on Spanish.');

    await expect(moveItemAction).not.toHaveBeenCalled();
  },
};
