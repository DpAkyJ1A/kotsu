import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useRef, useState } from 'react';
import { expect, fireEvent, mocked, waitFor } from 'storybook/test';

import { toast } from '@/ui/toast';

import { renameItemAction } from '../actions';
import type { Item } from '../core/item';
import type { Shelf } from '../core/shelf';
import { useItems } from '../hooks/use-items';
import { SAVE_AFTER_MS } from '../hooks/use-title-draft';
import { DocBreadcrumb } from './doc-breadcrumb';
import { DocTitle } from './doc-title';
import {
  ShelvesFromServer,
  startShelfServer,
} from './shelf-server-for-stories';

const SPANISH: Shelf = {
  id: '019a9c3e-0001-7000-8000-000000000001',
  name: 'Spanish',
  color: 'violet',
};
const VERBS: Item = {
  id: '019a9c3e-0101-7000-8000-000000000101',
  shelfId: SPANISH.id,
  kind: 'doc',
  title: 'Verbs',
};

type DocTitleStoryArgs = { shelves: Shelf[]; items: Item[] };

function RenameElsewhere() {
  const items = useItems();
  return (
    <button
      type="button"
      onClick={() => {
        items.rename(VERBS.id, 'Conjugations');
      }}
    >
      Rename in the sidebar
    </button>
  );
}

function DocTitleWithBody() {
  const body = useRef<HTMLTextAreaElement>(null);
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="grid max-w-2xl gap-4">
      <DocBreadcrumb doc={VERBS} shelf={SPANISH} />
      {isOpen && (
        <DocTitle
          id={VERBS.id}
          title={VERBS.title}
          onGoToBody={() => body.current?.focus()}
        />
      )}
      <textarea ref={body} aria-label="Body" className="border" />
      <RenameElsewhere />
      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
        }}
      >
        Close the doc
      </button>
    </div>
  );
}

const meta = {
  title: 'Shelves/DocTitle',
  args: { shelves: [SPANISH], items: [VERBS] },
  parameters: { nextjs: { appDirectory: true } },
  globals: { viewport: { value: 'desktop' } },
  render: () => <DocTitleWithBody />,
  decorators: [
    (Story) => (
      <ShelvesFromServer>
        <Story />
      </ShelvesFromServer>
    ),
  ],
  beforeEach: ({ args }) => {
    startShelfServer(args);
    return () => {
      toast.dismiss();
    };
  },
} satisfies Meta<DocTitleStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1 })).toContainElement(
      canvas.getByRole('textbox', { name: 'Doc title' }),
    );
    await expect(
      canvas.getByRole('textbox', { name: 'Doc title' }),
    ).toHaveAttribute('maxlength', '200');
  },
};

export const InRussian: Story = { globals: { locale: 'ru' } };

export const SavesOnceTheTypingPauses: Story = {
  play: async ({ canvas, userEvent }) => {
    const title = canvas.getByRole('textbox', { name: 'Doc title' });

    await userEvent.type(title, ' in the present');
    await expect(renameItemAction).not.toHaveBeenCalled();

    await waitFor(() => expect(renameItemAction).toHaveBeenCalledOnce(), {
      timeout: SAVE_AFTER_MS * 2,
    });
    await expect(renameItemAction).toHaveBeenCalledWith({
      id: VERBS.id,
      title: 'Verbs in the present',
    });
    await expect(title).toHaveFocus();
    await expect(
      canvas.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toHaveTextContent('Verbs in the present');
  },
};

export const SavesAtOnceWhenTheFieldIsLeft: Story = {
  play: async ({ canvas, userEvent }) => {
    const title = canvas.getByRole('textbox', { name: 'Doc title' });

    await userEvent.type(title, ' to learn');
    await userEvent.tab();

    await expect(renameItemAction).toHaveBeenCalledOnce();
    await expect(renameItemAction).toHaveBeenCalledWith({
      id: VERBS.id,
      title: 'Verbs to learn',
    });
    await new Promise((resolve) => setTimeout(resolve, SAVE_AFTER_MS));
    await expect(renameItemAction).toHaveBeenCalledOnce();
    await expect(title).toHaveValue('Verbs to learn');
  },
};

export const GoesToTheBodyOnEnter: Story = {
  play: async ({ canvas, userEvent }) => {
    const title = canvas.getByRole('textbox', { name: 'Doc title' });

    await userEvent.type(title, ' to learn{Enter}');

    await expect(canvas.getByRole('textbox', { name: 'Body' })).toHaveFocus();
    await expect(title).toHaveValue('Verbs to learn');
    await expect(renameItemAction).toHaveBeenCalledOnce();
    await expect(renameItemAction).toHaveBeenCalledWith({
      id: VERBS.id,
      title: 'Verbs to learn',
    });
  },
};

export const LetsEnterFinishAWordBeingComposed: Story = {
  play: async ({ canvas, userEvent }) => {
    const title = canvas.getByRole('textbox', { name: 'Doc title' });
    await userEvent.click(title);

    await fireEvent.keyDown(title, { key: 'Enter', isComposing: true });
    await expect(title).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('textbox', { name: 'Body' })).toHaveFocus();
  },
};

export const GoesToTheBodyOnArrowDownFromTheEnd: Story = {
  play: async ({ canvas, userEvent }) => {
    const title = canvas.getByRole('textbox', { name: 'Doc title' });
    const body = canvas.getByRole('textbox', { name: 'Body' });

    await userEvent.click(title);
    await userEvent.keyboard('{Home}{ArrowDown}');
    await expect(title).toHaveFocus();

    await userEvent.keyboard('{End}{ArrowDown}');
    await expect(body).toHaveFocus();
  },
};

export const PutsTheTitleBackWhenLeftEmpty: Story = {
  play: async ({ canvas, userEvent }) => {
    const title = canvas.getByRole('textbox', { name: 'Doc title' });

    await userEvent.clear(title);
    await expect(title).toHaveAttribute('placeholder', 'Verbs');
    await userEvent.tab();

    await expect(title).toHaveValue('Verbs');
    await new Promise((resolve) => setTimeout(resolve, SAVE_AFTER_MS));
    await expect(renameItemAction).not.toHaveBeenCalled();
  },
};

export const ShowsARenameMadeElsewhere: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Rename in the sidebar' }),
    );

    await expect(
      canvas.getByRole('textbox', { name: 'Doc title' }),
    ).toHaveValue('Conjugations');
  },
};

export const KeepsARenameMadeElsewhereAfterTheTitleSaved: Story = {
  play: async ({ canvas, userEvent }) => {
    const title = canvas.getByRole('textbox', { name: 'Doc title' });
    await userEvent.type(title, ' to learn');
    await waitFor(() => expect(renameItemAction).toHaveBeenCalledOnce(), {
      timeout: SAVE_AFTER_MS * 2,
    });

    await fireEvent.click(
      canvas.getByRole('button', { name: 'Rename in the sidebar' }),
    );
    await expect(title).toHaveFocus();
    await userEvent.tab();

    await expect(title).toHaveValue('Conjugations');
    await expect(renameItemAction).toHaveBeenCalledTimes(2);
    await expect(renameItemAction).toHaveBeenLastCalledWith({
      id: VERBS.id,
      title: 'Conjugations',
    });
  },
};

export const SavesWhatWasTypedWhenTheDocCloses: Story = {
  play: async ({ canvas, userEvent }) => {
    const title = canvas.getByRole('textbox', { name: 'Doc title' });
    await userEvent.type(title, ' to learn');

    await fireEvent.click(
      canvas.getByRole('button', { name: 'Close the doc' }),
    );

    await expect(title).not.toBeInTheDocument();
    await expect(renameItemAction).toHaveBeenCalledOnce();
    await expect(renameItemAction).toHaveBeenCalledWith({
      id: VERBS.id,
      title: 'Verbs to learn',
    });
    await new Promise((resolve) => setTimeout(resolve, SAVE_AFTER_MS));
    await expect(renameItemAction).toHaveBeenCalledOnce();
  },
};

export const TurnsPastedLinesIntoOne: Story = {
  play: async ({ canvas, userEvent }) => {
    const title = canvas.getByRole('textbox', { name: 'Doc title' });

    await userEvent.clear(title);
    await userEvent.paste('Spanish\nverbs\r\n in the present');

    await expect(title).toHaveValue('Spanish verbs in the present');
  },
};

export const PutsBackATitleTheServerRefused: Story = {
  play: async ({ canvas, userEvent }) => {
    mocked(renameItemAction).mockResolvedValue({
      ok: false,
      error: { code: 'INTERNAL' },
    });
    const title = canvas.getByRole('textbox', { name: 'Doc title' });

    await userEvent.type(title, ' to learn');
    await userEvent.tab();

    await waitFor(() => expect(title).toHaveValue('Verbs'));
  },
};
