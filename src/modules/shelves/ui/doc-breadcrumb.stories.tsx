import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';

import type { Item } from '../core/item';
import type { Shelf } from '../core/shelf';
import { useItems } from '../hooks/use-items';
import { DocBreadcrumb } from './doc-breadcrumb';
import {
  ShelvesFromServer,
  startShelfServer,
} from './shelf-server-for-stories';

const SPANISH: Shelf = {
  id: '019a9c3e-0001-7000-8000-000000000001',
  name: 'Spanish',
  color: 'violet',
};
const LANGUAGES: Shelf = {
  id: '019a9c3e-0002-7000-8000-000000000002',
  name: 'Languages',
  color: 'blue',
};
const VERBS: Item = {
  id: '019a9c3e-0101-7000-8000-000000000101',
  shelfId: SPANISH.id,
  kind: 'doc',
  title: 'Verbs',
};

type DocBreadcrumbStoryArgs = { shelves: Shelf[]; items: Item[] };

function ChangesElsewhere() {
  const items = useItems();
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => {
          items.rename(VERBS.id, 'Conjugations');
        }}
      >
        Rename in the sidebar
      </button>
      <button
        type="button"
        onClick={() => {
          items.move(VERBS.id, LANGUAGES.id, undefined);
        }}
      >
        Move in the sidebar
      </button>
    </div>
  );
}

const meta = {
  title: 'Shelves/DocBreadcrumb',
  args: { shelves: [SPANISH, LANGUAGES], items: [VERBS] },
  parameters: { nextjs: { appDirectory: true } },
  globals: { viewport: { value: 'desktop' } },
  render: () => (
    <div className="grid gap-4">
      <header className="flex h-14 items-center gap-3">
        <DocBreadcrumb doc={VERBS} shelf={SPANISH} />
      </header>
      <ChangesElsewhere />
    </div>
  ),
  decorators: [
    (Story) => (
      <ShelvesFromServer>
        <Story />
      </ShelvesFromServer>
    ),
  ],
  beforeEach: ({ args }) => {
    startShelfServer(args);
  },
} satisfies Meta<DocBreadcrumbStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OnADesktop: Story = {
  play: async ({ canvas }) => {
    const breadcrumb = canvas.getByRole('navigation', { name: 'Breadcrumb' });

    await expect(breadcrumb).toHaveTextContent('SpanishVerbs');
    await expect(canvas.getByRole('link', { name: 'Spanish' })).toHaveAttribute(
      'href',
      `/shelves/${SPANISH.id}`,
    );
    await expect(breadcrumb.querySelector('li[aria-hidden] > svg')).toHaveClass(
      'lucide-chevron-right',
    );
  },
};

export const OnAPhone: Story = {
  globals: { viewport: { value: 'mobile2' } },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeNull();
    await expect(
      canvas.getByRole('link', { name: 'Back to Spanish' }),
    ).toHaveAttribute('href', `/shelves/${SPANISH.id}`);
  },
};

export const OnAPhoneInRussian: Story = {
  globals: { viewport: { value: 'mobile2' }, locale: 'ru' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: 'Назад к полке Spanish' }),
    ).toBeVisible();
  },
};

export const FollowsARenameAndAMoveMadeElsewhere: Story = {
  play: async ({ canvas, userEvent }) => {
    const breadcrumb = canvas.getByRole('navigation', { name: 'Breadcrumb' });

    await userEvent.click(
      canvas.getByRole('button', { name: 'Rename in the sidebar' }),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Move in the sidebar' }),
    );

    await expect(breadcrumb).toHaveTextContent('LanguagesConjugations');
    await expect(
      canvas.getByRole('link', { name: 'Languages' }),
    ).toHaveAttribute('href', `/shelves/${LANGUAGES.id}`);
  },
};
