import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { JSONContent } from '@tiptap/core';
import { expect, waitFor } from 'storybook/test';

import { ShelvesProvider } from '@/modules/shelves';

import type { Doc } from '../core/doc';
import { DocEditor } from './doc-editor';

const SPANISH = {
  id: '019a9c3e-0001-7000-8000-000000000001',
  name: 'Spanish',
  color: 'violet',
} as const;
const VERBS = {
  id: '019a9c3e-0101-7000-8000-000000000101',
  shelfId: SPANISH.id,
  kind: 'doc',
  title: 'Verbs',
} as const;

function text(value: string, mark?: string): JSONContent {
  return {
    type: 'text',
    text: value,
    ...(mark && { marks: [{ type: mark }] }),
  };
}

function paragraph(...content: JSONContent[]): JSONContent {
  return { type: 'paragraph', content };
}

function heading(level: number, value: string): JSONContent {
  return { type: 'heading', attrs: { level }, content: [text(value)] };
}

function list(type: string, ...items: string[]): JSONContent {
  return {
    type,
    content: items.map((item) => ({
      type: 'listItem',
      content: [paragraph(text(item))],
    })),
  };
}

const VERBS_BODY: JSONContent = {
  type: 'doc',
  content: [
    paragraph(
      text('Regular verbs end in '),
      text('-ar', 'bold'),
      text(', '),
      text('-er', 'italic'),
      text(' or '),
      text('-ir', 'code'),
      text('. '),
      text('Ser', 'strike'),
      text(' is not one of them.'),
    ),
    heading(1, 'Present tense'),
    heading(2, 'Hablar, to speak'),
    list('bulletList', 'yo hablo', 'tú hablas', 'él habla'),
    heading(3, 'This week'),
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [paragraph(text('Conjugate ten verbs'))],
        },
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [paragraph(text('Read a page of a novel out loud'))],
        },
      ],
    },
    list('orderedList', 'Listen', 'Repeat', 'Write it down'),
    {
      type: 'blockquote',
      content: [paragraph(text('Poco a poco se va lejos.'))],
    },
    {
      type: 'codeBlock',
      content: [text('hablar → hablo, hablas, habla')],
    },
    { type: 'horizontalRule' },
    paragraph(text('Next: the past tense.')),
  ],
};

type DocEditorStoryArgs = { content: Doc['content'] };

const meta = {
  title: 'Docs/DocEditor',
  args: { content: VERBS_BODY },
  parameters: { nextjs: { appDirectory: true } },
  globals: { viewport: { value: 'desktop' } },
  render: ({ content }) => (
    <DocEditor
      doc={{ id: VERBS.id, content, version: 1 }}
      title={VERBS.title}
    />
  ),
  decorators: [
    (Story) => (
      <ShelvesProvider shelves={[SPANISH]} items={[VERBS]}>
        <Story />
      </ShelvesProvider>
    ),
  ],
} satisfies Meta<DocEditorStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithText: Story = {
  play: async ({ canvas }) => {
    const body = canvas.getByRole('textbox', { name: 'Doc text' });

    await waitFor(() =>
      expect(body).toHaveTextContent('Poco a poco se va lejos.'),
    );
    await expect(body).not.toHaveFocus();
  },
};

export const OnAPhone: Story = {
  globals: { viewport: { value: 'mobile2' } },
};

export const ANewDoc: Story = {
  args: { content: null },
  play: async ({ canvas }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });

    await waitFor(() => expect(body).toHaveFocus());
    await expect(body.querySelector('p')).toHaveAttribute(
      'data-placeholder',
      'Start writing. Markdown works too: #\u00a0heading, -\u00a0list, []\u00a0checklist',
    );
  },
};

export const ANewDocInRussian: Story = {
  args: { content: null },
  globals: { locale: 'ru' },
};

export const GoesFromTheTitleToTheStartOfTheText: Story = {
  play: async ({ canvas, userEvent }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await waitFor(() => expect(body).toHaveTextContent('Regular verbs'));

    await userEvent.click(canvas.getByRole('textbox', { name: 'Doc title' }));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(body).toHaveFocus());
    await userEvent.keyboard('Los ');

    await expect(body.querySelector('p')).toHaveTextContent(
      /^Los Regular verbs/,
    );
  },
};
