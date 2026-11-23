import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { JSONContent } from '@tiptap/core';
import { expect, fireEvent, screen, waitFor, within } from 'storybook/test';

import { LARGEST_DOC_BYTES } from '../core/save-limits';
import type { SaveStatus } from '../core/save-state';
import { useDocEditor } from '../hooks/use-doc-editor';
import { DocSaveStatus } from './doc-save-status';

const GUITAR: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Guitar' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Practise the C, G and Am chords.' }],
    },
  ],
};

const STORAGE_HREF = { pathname: '/settings/storage' };

const OPENS_ON_HOVER_AFTER_MS = 200;
const AN_HOUR_MS = 60 * 60 * 1_000;

type DocSaveStatusStoryArgs = {
  status: SaveStatus;
  sizeBytes: number;
  savedAt: number | null;
};

function WithAnEditor(args: DocSaveStatusStoryArgs) {
  const editor = useDocEditor(GUITAR);

  return <DocSaveStatus {...args} editor={editor} storageHref={STORAGE_HREF} />;
}

function percentOfTheLargestDoc(percent: number) {
  return (LARGEST_DOC_BYTES * percent) / 100;
}

const meta = {
  title: 'Docs/DocSaveStatus',
  args: { status: 'saved', sizeBytes: 2_400, savedAt: null },
  render: (args) => <WithAnEditor {...args} />,
  decorators: [
    (Story) => (
      <div className="flex w-96 items-center justify-between gap-3 bg-background p-4 text-sm">
        <button type="button" className="text-muted-foreground">
          Guitar › Chords
        </button>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<DocSaveStatusStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

function saveStatus() {
  return screen.getByRole('status', { name: '' });
}

function trigger() {
  return within(saveStatus()).getByRole('button');
}

async function details(name = 'Doc details') {
  const dialog = await screen.findByRole('dialog', { name });
  await waitFor(() => expect(dialog).toBeVisible());
  return dialog;
}

function markOf(status: HTMLElement) {
  return status.querySelector('[data-mark]');
}

function fillBarOf(status: HTMLElement) {
  return status.querySelector('[data-fill]');
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const SavedAsOpened: Story = {
  play: async () => {
    await expect(saveStatus()).toHaveTextContent('Saved');
    await expect(within(saveStatus()).getByText('Saved')).toHaveClass(
      'sr-only',
    );
    await expect(markOf(saveStatus())).toHaveAttribute('data-mark', 'saved');
    await expect(markOf(saveStatus())).not.toHaveClass('animate-just-done');
    await expect(fillBarOf(saveStatus())).toBeNull();
  },
};

export const JustSaved: Story = {
  args: { savedAt: Date.now() - 5_000 },
  play: async ({ userEvent }) => {
    await expect(markOf(saveStatus())).toHaveClass('animate-just-done');

    await userEvent.click(trigger());

    const dialog = await details();
    await expect(within(dialog).getByText('All changes saved')).toBeVisible();
    await expect(within(dialog).getByText('Saved')).toBeVisible();
    await expect(within(dialog).getByText(/seconds ago|now/)).toBeVisible();
  },
};

export const SavedJustNowAndNeverInTheFuture: Story = {
  args: { savedAt: Date.now() + AN_HOUR_MS },
  play: async ({ userEvent }) => {
    await userEvent.click(trigger());

    const dialog = await details();
    await expect(
      within(dialog).getByText('Saved').nextElementSibling,
    ).toHaveTextContent('now');
  },
};

export const Saving: Story = {
  args: { status: 'saving', savedAt: Date.now() },
  play: async () => {
    await expect(saveStatus()).toHaveTextContent('Saving…');
    await expect(markOf(saveStatus())).toHaveAttribute('data-mark', 'saving');
  },
};

export const Offline: Story = {
  args: { status: 'offline' },
  play: async ({ userEvent }) => {
    const words = within(saveStatus()).getByText('Offline');
    await expect(words).toBeVisible();
    await expect(words).toHaveClass('text-red-foreground');
    await expect(markOf(saveStatus())).toHaveAttribute('data-mark', 'problem');

    await userEvent.click(trigger());

    const dialog = await details();
    await expect(within(dialog).getByText("You're offline")).toBeVisible();
    await expect(
      within(dialog).queryByText('Saved', { exact: true }),
    ).not.toBeInTheDocument();
  },
};

export const FullAndNotSent: Story = {
  args: { status: 'tooLong', sizeBytes: LARGEST_DOC_BYTES + 1 },
  play: async ({ userEvent }) => {
    await expect(within(saveStatus()).getByText('Doc full')).toBeVisible();
    await expect(fillBarOf(saveStatus())).toHaveAttribute(
      'data-fill',
      'overfull',
    );

    await userEvent.click(trigger());

    const dialog = await details();
    await expect(
      within(dialog).getByText("This doc is full — changes aren't saved"),
    ).toBeVisible();
    await expect(within(dialog).getByText('501 kB of 500 kB')).toBeVisible();
  },
};

export const StorageFull: Story = {
  args: { status: 'storageFull' },
  play: async ({ userEvent }) => {
    await expect(within(saveStatus()).getByText('Storage full')).toBeVisible();

    await userEvent.click(trigger());

    const dialog = await details();
    await expect(
      within(dialog).getByRole('link', { name: 'See what takes space' }),
    ).toHaveAttribute('href', '/settings/storage');
  },
};

export const NotSaved: Story = {
  args: { status: 'notSaved' },
  play: async () => {
    await expect(within(saveStatus()).getByText('Not saved')).toBeVisible();
  },
};

export const ShowsHowFullFrom80Percent: Story = {
  args: { sizeBytes: percentOfTheLargestDoc(80) },
  play: async () => {
    await expect(fillBarOf(saveStatus())).toHaveAttribute(
      'data-fill',
      'filling',
    );
    await expect(
      within(saveStatus()).queryByText('Doc almost full'),
    ).not.toBeInTheDocument();
  },
};

export const ShowsNoBarUnder80Percent: Story = {
  args: { sizeBytes: percentOfTheLargestDoc(80) - 1 },
  play: async () => {
    await expect(fillBarOf(saveStatus())).toBeNull();
  },
};

export const WarnsFrom90Percent: Story = {
  args: { status: 'saving', sizeBytes: percentOfTheLargestDoc(92) },
  play: async ({ userEvent }) => {
    await expect(
      within(saveStatus()).getByText('Doc almost full'),
    ).toBeVisible();
    await expect(fillBarOf(saveStatus())).toHaveAttribute(
      'data-fill',
      'almostFull',
    );

    await userEvent.click(trigger());

    const dialog = await details();
    await expect(
      within(dialog).getByText(
        'This doc is almost full. Start the next part in a new doc.',
      ),
    ).toBeVisible();
    await expect(within(dialog).getByText('460 kB of 500 kB')).toBeVisible();
  },
};

export const CountsTheWordsAndCharacters: Story = {
  play: async ({ userEvent }) => {
    await userEvent.click(trigger());

    const dialog = await details();
    await expect(
      within(dialog).getByText('Words').nextElementSibling,
    ).toHaveTextContent('8');
    await expect(
      within(dialog).getByText('Characters').nextElementSibling,
    ).toHaveTextContent('38');
    await expect(
      within(dialog).getByText('Size').nextElementSibling,
    ).toHaveTextContent('2.4 kB of 500 kB');
    await expect(
      within(dialog).getByText(
        'One doc holds up to 500 kB, about 100–350 thousand characters.',
      ),
    ).toBeVisible();
  },
};

export const OpensOnHoverAndLeavesTheFocusWhereItWas: Story = {
  play: async ({ canvas, userEvent }) => {
    const elsewhere = canvas.getByRole('button', { name: 'Guitar › Chords' });
    elsewhere.focus();

    await userEvent.hover(trigger());
    await expect(
      screen.queryByRole('dialog', { name: 'Doc details' }),
    ).not.toBeInTheDocument();

    await details();
    await expect(elsewhere).toHaveFocus();

    await userEvent.unhover(trigger());
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Doc details' }),
      ).not.toBeInTheDocument(),
    );
    await expect(elsewhere).toHaveFocus();
  },
};

export const DoesNotOpenWhenThePointerOnlyPassesOver: Story = {
  play: async ({ userEvent }) => {
    await userEvent.hover(trigger());
    await pause(OPENS_ON_HOVER_AFTER_MS / 4);
    await userEvent.unhover(trigger());
    await pause(OPENS_ON_HOVER_AFTER_MS * 2);

    await expect(
      screen.queryByRole('dialog', { name: 'Doc details' }),
    ).not.toBeInTheDocument();
  },
};

export const StaysOpenWhileThePointerIsOnItAndClosesWhenItLeaves: Story = {
  play: async ({ userEvent }) => {
    await userEvent.hover(trigger());
    const dialog = await details();

    await userEvent.unhover(trigger());
    await userEvent.hover(dialog);
    await pause(OPENS_ON_HOVER_AFTER_MS * 2);
    await expect(dialog).toBeInTheDocument();

    await userEvent.unhover(dialog);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

export const EscapeClosesAHoveredOneAndLeavesTheFocusWhereItWas: Story = {
  play: async ({ canvas, userEvent }) => {
    const elsewhere = canvas.getByRole('button', { name: 'Guitar › Chords' });
    elsewhere.focus();
    await userEvent.hover(trigger());
    const dialog = await details();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(elsewhere).toHaveFocus();
  },
};

export const AClickWhileHoveredKeepsItOpen: Story = {
  play: async ({ userEvent }) => {
    await userEvent.hover(trigger());
    const dialog = await details();

    await userEvent.click(trigger());
    await userEvent.unhover(trigger());
    await pause(OPENS_ON_HOVER_AFTER_MS * 2);
    await expect(dialog).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(trigger()).toHaveFocus();
  },
};

export const StaysOpenWhenThePointerLeavesAfterAClick: Story = {
  play: async ({ userEvent }) => {
    await userEvent.click(trigger());
    const dialog = await details();

    await userEvent.unhover(trigger());
    await pause(OPENS_ON_HOVER_AFTER_MS * 2);

    await expect(dialog).toBeInTheDocument();
  },
};

export const EnterOnAHoveredOneMovesTheFocusIntoIt: Story = {
  play: async ({ canvas, userEvent }) => {
    canvas.getByRole('button', { name: 'Guitar › Chords' }).focus();
    await userEvent.hover(trigger());
    const dialog = await details();

    await userEvent.tab();
    await expect(trigger()).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(dialog).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(trigger()).toHaveFocus();
  },
};

export const OpensFromTheKeyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    canvas.getByRole('button', { name: 'Guitar › Chords' }).focus();

    await userEvent.tab();
    await expect(trigger()).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    const dialog = await details();
    await waitFor(() => expect(dialog).toHaveFocus());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(trigger()).toHaveFocus();
  },
};

export const OpensWithATapAndNotOnTouch: Story = {
  play: async ({ userEvent }) => {
    await fireEvent.pointerOver(trigger(), { pointerType: 'touch' });
    await pause(OPENS_ON_HOVER_AFTER_MS * 2);
    await expect(
      screen.queryByRole('dialog', { name: 'Doc details' }),
    ).not.toBeInTheDocument();

    await userEvent.pointer({ keys: '[TouchA]', target: trigger() });
    const dialog = await details();

    await userEvent.pointer({ keys: '[TouchA]', target: trigger() });
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

export const DoesNotOpenOnAPenHover: Story = {
  play: async () => {
    await fireEvent.pointerOver(trigger(), { pointerType: 'pen' });
    await pause(OPENS_ON_HOVER_AFTER_MS * 2);

    await expect(
      screen.queryByRole('dialog', { name: 'Doc details' }),
    ).not.toBeInTheDocument();
  },
};

export const InRussian: Story = {
  args: { status: 'tooLong', sizeBytes: LARGEST_DOC_BYTES + 1 },
  globals: { locale: 'ru' },
  play: async ({ userEvent }) => {
    await expect(saveStatus()).toHaveTextContent('Док заполнен');

    await userEvent.click(trigger());

    const dialog = await details('Сведения о доке');
    await expect(
      within(dialog).getByText(
        'Перенеси часть текста в новый док, и этот снова начнёт сохраняться.',
      ),
    ).toBeVisible();
  },
};
