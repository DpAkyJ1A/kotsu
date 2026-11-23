import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import type { JSONContent, TiptapEditorHTMLElement } from '@tiptap/core';
import { expect, mocked, screen, spyOn, waitFor, within } from 'storybook/test';

import { ShelvesProvider } from '@/modules/shelves';
import { SidebarInset, SidebarProvider } from '@/ui/sidebar';
import { TooltipProvider } from '@/ui/tooltip';

import { saveDocAction } from '../actions';
import type { Doc } from '../core/doc';
import { SAVE_AFTER_MS } from '../core/save-limits';
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

const STORAGE_HREF = {
  pathname: `/docs/${VERBS.id}`,
  query: { settings: 'storage' },
};

const meta = {
  title: 'Docs/DocEditor',
  args: { content: VERBS_BODY },
  parameters: { nextjs: { appDirectory: true } },
  globals: { viewport: { value: 'desktop' } },
  render: ({ content }) => (
    <DocEditor
      doc={{ id: VERBS.id, content, version: 1 }}
      title={VERBS.title}
      place={{ doc: VERBS, shelf: SPANISH }}
      storageHref={STORAGE_HREF}
    />
  ),
  decorators: [
    (Story) => (
      <TooltipProvider>
        <ShelvesProvider shelves={[SPANISH]} items={[VERBS]}>
          <SidebarProvider defaultState="closed">
            <SidebarInset>
              <Story />
            </SidebarInset>
          </SidebarProvider>
        </ShelvesProvider>
      </TooltipProvider>
    ),
  ],
  beforeEach: () => {
    mocked(saveDocAction).mockImplementation(({ version }) =>
      Promise.resolve({ ok: true, data: { version: version + 1 } }),
    );
  },
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

const DOC_HINT =
  'Start writing, or type / for blocks. Markdown works too: #\u00a0heading, -\u2060\u00a0list, []\u00a0checklist';
const LINE_HINT = 'Type / for blocks';

function seenOnly(hint: string) {
  return `"${hint}" / ""`;
}

function hintsIn(body: HTMLElement) {
  return [...body.querySelectorAll('*')]
    .map((element) => getComputedStyle(element, '::before').content)
    .filter((content) => content !== 'none');
}

export const ANewDoc: Story = {
  args: { content: null },
  play: async ({ canvas }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });

    await waitFor(() => expect(body).toHaveFocus());
    await expect(hintsIn(body)).toEqual([seenOnly(DOC_HINT)]);
  },
};

export const ANewDocKeepsItsHintWithoutTheCaret: Story = {
  args: { content: null },
  play: async ({ canvas, userEvent }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await waitFor(() => expect(body).toHaveFocus());

    await userEvent.click(canvas.getByRole('textbox', { name: 'Doc title' }));

    await expect(body).not.toHaveFocus();
    await expect(hintsIn(body)).toEqual([seenOnly(DOC_HINT)]);
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

function blocksMenu() {
  return screen.findByRole('listbox', { name: 'Blocks' });
}

async function untilFocused(body: HTMLElement) {
  await waitFor(() => expect(body).toHaveFocus());
}

function editorOf(body: HTMLElement) {
  const { editor } = body as TiptapEditorHTMLElement;
  if (!editor) throw new Error('The body has no editor');
  return editor;
}

async function expectInsideTheWindow(element: Element) {
  const { top, right, bottom, left } = element.getBoundingClientRect();
  await expect(left).toBeGreaterThanOrEqual(0);
  await expect(top).toBeGreaterThanOrEqual(0);
  await expect(right).toBeLessThanOrEqual(window.innerWidth);
  await expect(bottom).toBeLessThanOrEqual(window.innerHeight);
}

export const AnEmptyLineHintsAtTheSlashMenuUntilTheFirstLetter: Story = {
  args: { content: null },
  play: async ({ canvas, userEvent }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await untilFocused(body);

    await userEvent.keyboard('hablo{Enter}');
    await expect(hintsIn(body)).toEqual([seenOnly(LINE_HINT)]);
    await expect(body.lastElementChild).toHaveAttribute(
      'data-placeholder',
      LINE_HINT,
    );

    await userEvent.keyboard('h');
    await expect(hintsIn(body)).toEqual([]);
  },
};

export const TheLastEmptyLineHintsOnlyWithTheCaretInIt: Story = {
  args: {
    content: {
      type: 'doc',
      content: [paragraph(text('yo hablo')), heading(2, 'Present tense')],
    },
  },
  play: async ({ canvas, userEvent }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await waitFor(() => expect(body.lastElementChild?.tagName).toBe('P'));
    await expect(hintsIn(body)).toEqual([]);

    editorOf(body).commands.focus('end');
    await untilFocused(body);
    await expect(hintsIn(body)).toEqual([seenOnly(LINE_HINT)]);

    await userEvent.click(canvas.getByRole('textbox', { name: 'Doc title' }));
    await expect(body.lastElementChild).toHaveAttribute(
      'data-placeholder',
      LINE_HINT,
    );
    await expect(hintsIn(body)).toEqual([]);
  },
};

function hintsOfTheLines(body: HTMLElement) {
  return [...body.children].map(
    (line) => getComputedStyle(line, '::before').content,
  );
}

export const AnEmptyLineHintsOnlyWhileNothingIsSelected: Story = {
  args: {
    content: {
      type: 'doc',
      content: [
        paragraph(text('yo hablo')),
        paragraph(),
        paragraph(text('tú hablas')),
      ],
    },
  },
  play: async ({ canvas }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await waitFor(() => expect(body).toHaveTextContent('tú hablas'));
    const middleLine = 'yo hablo'.length + 3;

    editorOf(body).chain().setTextSelection(middleLine).focus().run();
    await untilFocused(body);
    await expect(hintsOfTheLines(body)).toEqual([
      'none',
      seenOnly(LINE_HINT),
      'none',
    ]);

    editorOf(body).commands.setTextSelection({
      from: middleLine,
      to: middleLine + 'tú'.length + 2,
    });
    await expect(hintsIn(body)).toEqual([]);

    editorOf(body).commands.setTextSelection(middleLine);
    await expect(hintsOfTheLines(body)).toEqual([
      'none',
      seenOnly(LINE_HINT),
      'none',
    ]);
  },
};

export const ANewDocKeepsItsHintWithEverythingSelected: Story = {
  args: { content: null },
  play: async ({ canvas }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await waitFor(() => expect(body).toHaveFocus());

    editorOf(body).commands.selectAll();

    await expect(hintsIn(body)).toEqual([seenOnly(DOC_HINT)]);
  },
};

export const NoHintInAnEmptyListItemHeadingQuoteOrCode: Story = {
  args: { content: null },
  play: async ({ canvas, userEvent }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await untilFocused(body);

    for (const [shortcut, block] of [
      ['- ', 'ul > li p'],
      ['1. ', 'ol > li p'],
      ['[[] ', '[data-type="taskList"] p'],
      ['## ', 'h2'],
      ['> ', 'blockquote p'],
      ['``` ', 'pre'],
    ] as const) {
      editorOf(body)
        .chain()
        .setContent({ type: 'doc', content: [paragraph(text('hablo'))] })
        .focus('end')
        .run();
      await userEvent.keyboard(`{Enter}${shortcut}`);

      await expect(body.querySelector(block)?.textContent, block).toBe('');
      await expect(hintsIn(body), block).toEqual([]);
    }
  },
};

export const SlashMenu: Story = {
  args: { content: null },
  play: async ({ canvas, userEvent }) => {
    await untilFocused(
      await canvas.findByRole('textbox', { name: 'Doc text' }),
    );

    await userEvent.keyboard('/');

    const menu = await blocksMenu();
    await expect(
      within(menu).getByRole('option', { name: /^Text / }),
    ).toHaveAttribute('aria-selected', 'true');
  },
};

export const SlashMenuScrolledToItsLastBlock: Story = {
  args: { content: null },
  play: async ({ canvas, userEvent }) => {
    await untilFocused(
      await canvas.findByRole('textbox', { name: 'Doc text' }),
    );
    await userEvent.keyboard('/');
    const menu = await blocksMenu();

    await userEvent.keyboard('{ArrowUp}');

    const divider = within(menu).getByRole('option', { name: /^Divider / });
    await waitFor(() => expect(menu.scrollTop).toBeGreaterThan(0));
    await expect(divider.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      menu.getBoundingClientRect().bottom,
    );
  },
};

export const SlashMenuWithNothingFound: Story = {
  args: { content: null },
  play: async ({ canvas, userEvent }) => {
    await untilFocused(
      await canvas.findByRole('textbox', { name: 'Doc text' }),
    );

    await userEvent.keyboard('/zzz');

    const empty = await screen.findByText('No matching blocks');
    await waitFor(() => expect(empty).toBeVisible());
  },
};

export const SlashMenuInRussian: Story = {
  args: { content: null },
  globals: { locale: 'ru' },
  play: async ({ canvas, userEvent }) => {
    await untilFocused(
      await canvas.findByRole('textbox', { name: 'Текст дока' }),
    );

    await userEvent.keyboard('/');

    await screen.findByRole('listbox', { name: 'Блоки' });
  },
};

export const SlashMenuOnAPhoneAtTheEndOfALine: Story = {
  args: { content: null },
  globals: { viewport: { value: 'mobile2' } },
  play: async ({ canvas, userEvent }) => {
    await untilFocused(
      await canvas.findByRole('textbox', { name: 'Doc text' }),
    );

    await userEvent.keyboard('Todos los días hablo un poco más /');

    await expectInsideTheWindow(await blocksMenu());
  },
};

export const SlashMenuAtTheBottomOfTheScreen: Story = {
  args: {
    content: {
      type: 'doc',
      content: Array.from({ length: 40 }, (_, line) =>
        paragraph(text(`Line ${String(line + 1)}: yo hablo, tú hablas`)),
      ),
    },
  },
  play: async ({ canvas, userEvent }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await waitFor(() => expect(body).toHaveTextContent('Line 40'));
    editorOf(body).commands.focus('end');
    await untilFocused(body);
    body.lastElementChild?.scrollIntoView({ block: 'end' });

    await userEvent.keyboard(' /');

    const menu = await blocksMenu();
    const slash = body.querySelector('.suggestion');
    await waitFor(() =>
      expect(menu.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        slash?.getBoundingClientRect().top ?? 0,
      ),
    );
    await expectInsideTheWindow(menu);
  },
};

export const TheTitleHasNoSlashMenu: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('textbox', { name: 'Doc title' }));

    await userEvent.keyboard(' /');

    await expect(
      canvas.getByRole('textbox', { name: 'Doc title' }),
    ).toHaveValue('Verbs /');
    await expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  },
};

function positionOf(body: HTMLElement, word: string) {
  let found = -1;
  editorOf(body).state.doc.descendants((node, pos) => {
    const index = node.isText ? (node.text ?? '').indexOf(word) : -1;
    if (found === -1 && index !== -1) found = pos + index;
  });
  return found;
}

function formattingToolbar() {
  return screen.getByRole('toolbar', { name: 'Formatting' });
}

const LONG_BODY: JSONContent = {
  type: 'doc',
  content: Array.from({ length: 60 }, (_, line) =>
    paragraph(text(`Line ${String(line + 1)}: yo hablo, tú hablas`)),
  ),
};

export const TheToolbarLightsUpWhereTheCaretIs: Story = {
  play: async ({ canvas, userEvent }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await waitFor(() => expect(body).toHaveTextContent('Hablar, to speak'));
    const toolbar = formattingToolbar();
    const heading2 = within(toolbar).getByRole('button', { name: 'Heading 2' });

    editorOf(body).commands.focus(positionOf(body, 'Hablar') + 1);

    await waitFor(() =>
      expect(heading2).toHaveAttribute('aria-pressed', 'true'),
    );
    await userEvent.hover(heading2);
    const tooltip = await screen.findByRole('tooltip');
    await waitFor(() => expect(tooltip).toBeVisible());
    await expect(tooltip).toHaveTextContent(/^Heading 2 .+ ##$/);
  },
};

type Box = Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left'>;

function boxOf(element: Element): Box {
  return element.getBoundingClientRect();
}

function docBar() {
  const bar = formattingToolbar().closest('[data-slot="doc-bar"]');
  if (!bar) throw new Error('The toolbar is not in the doc bar');
  return bar;
}

function breadcrumb() {
  return screen.getByRole('navigation', { name: 'Breadcrumb' });
}

function middleOf({ left, right }: Box) {
  return (left + right) / 2;
}

function isOnOneRow(first: Box, second: Box) {
  return first.top < second.bottom && second.top < first.bottom;
}

async function expectTheToolbarCentredOverTheText(body: HTMLElement) {
  const [toolbar, text] = [boxOf(formattingToolbar()), boxOf(body)];

  await expect(middleOf(toolbar)).toBeCloseTo(middleOf(text), 0);
  await expect(toolbar.left).toBeLessThanOrEqual(text.left);
  await expect(toolbar.right).toBeGreaterThanOrEqual(text.right);
}

const aWidePage: Decorator = (Story) => (
  <div className="w-300">
    <Story />
  </div>
);

const aNarrowerPage: Decorator = (Story) => (
  <div className="w-256">
    <Story />
  </div>
);

const aNarrowPageBesideTheSidebar: Decorator = (Story) => (
  <div className="w-132">
    <Story />
  </div>
);

export const OnAWidePageTheBarIsOneRowWithTheToolbarOverTheText: Story = {
  decorators: [aWidePage],
  play: async ({ canvas }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    const title = canvas.getByRole('textbox', { name: 'Doc title' });
    const place = boxOf(breadcrumb());
    const toolbar = boxOf(formattingToolbar());
    const status = boxOf(saveStatus());

    await expect(isOnOneRow(place, toolbar)).toBe(true);
    await expect(isOnOneRow(toolbar, status)).toBe(true);
    await expect(place.right).toBeLessThanOrEqual(toolbar.left);
    await expect(toolbar.right).toBeLessThanOrEqual(status.left);
    await expectTheToolbarCentredOverTheText(body);
    await expect(boxOf(docBar()).bottom).toBeLessThanOrEqual(boxOf(title).top);
  },
};

export const OnANarrowerPageTheToolbarGoesUnderThePlace: Story = {
  decorators: [aNarrowerPage],
  play: async ({ canvas }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    const title = canvas.getByRole('textbox', { name: 'Doc title' });
    const place = boxOf(breadcrumb());
    const toolbar = boxOf(formattingToolbar());
    const status = boxOf(saveStatus());

    await expect(isOnOneRow(place, status)).toBe(true);
    await expect(toolbar.top).toBeGreaterThanOrEqual(
      Math.max(place.bottom, status.bottom),
    );
    await expectTheToolbarCentredOverTheText(body);
    await expect(boxOf(docBar()).bottom).toBeLessThanOrEqual(boxOf(title).top);
  },
};

async function scrolledDownALongDoc(
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
) {
  const body = await canvas.findByRole('textbox', { name: 'Doc text' });
  await waitFor(() => expect(body).toHaveTextContent('Line 60'));
  window.scrollTo(0, 800);
  await waitFor(() => expect(window.scrollY).toBe(800));
  return body;
}

async function expectTheWholeBarInTheWindow() {
  await expect(boxOf(docBar()).top).toBe(0);
  for (const part of [breadcrumb(), formattingToolbar(), saveStatus()]) {
    await expect(boxOf(part).top).toBeGreaterThanOrEqual(0);
  }
}

export const TheBarStaysAtTheTopOfTheWindow: Story = {
  args: { content: LONG_BODY },
  decorators: [aWidePage],
  play: async ({ canvas }) => {
    await scrolledDownALongDoc(canvas);

    await expectTheWholeBarInTheWindow();
    await expect(
      boxOf(canvas.getByRole('textbox', { name: 'Doc title' })).bottom,
    ).toBeLessThan(0);
  },
};

export const TheBarStaysAtTheTopOfTheWindowOverANarrowerPageToo: Story = {
  args: { content: LONG_BODY },
  decorators: [aNarrowerPage],
  play: async ({ canvas }) => {
    await scrolledDownALongDoc(canvas);

    await expectTheWholeBarInTheWindow();
  },
};

const NO_COLOUR = 'rgba(0, 0, 0, 0)';

export const TheBarShowsItsEdgeOnlyOnceThePageScrolls: Story = {
  args: { content: LONG_BODY },
  play: async ({ canvas }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await waitFor(() => expect(body).toHaveTextContent('Line 60'));
    const edgeColour = () => getComputedStyle(docBar()).borderBottomColor;
    const height = () => docBar().getBoundingClientRect().height;
    window.scrollTo(0, 0);
    await waitFor(() => expect(edgeColour()).toBe(NO_COLOUR));
    const heightAtTheTop = height();

    window.scrollTo(0, 1);

    await waitFor(() =>
      expect(edgeColour()).toBe(
        getComputedStyle(breadcrumb()).borderBottomColor,
      ),
    );
    await expect(getComputedStyle(docBar()).borderBottomWidth).toBe('1px');
    await expect(height()).toBe(heightAtTheTop);
  },
};

async function expectTheCaretToStayClearOfTheBar(
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
) {
  const body = await canvas.findByRole('textbox', { name: 'Doc text' });
  await waitFor(() => expect(body).toHaveTextContent('Line 60'));
  const editor = editorOf(body);
  const barBottom = () => boxOf(docBar()).bottom;
  const caretTop = () =>
    editor.view.coordsAtPos(editor.state.selection.from).top;
  window.scrollTo(0, 1200);
  const lineUnderTheBar = [...body.children].find(
    (line) => boxOf(line).top > 0,
  );
  if (!lineUnderTheBar) throw new Error('No line in the window');
  editor.commands.focus(editor.view.posAtDOM(lineUnderTheBar, 0), {
    scrollIntoView: false,
  });
  await untilFocused(body);
  await expect(caretTop()).toBeLessThan(barBottom());

  editor.commands.scrollIntoView();

  await waitFor(() => expect(caretTop()).toBeGreaterThanOrEqual(barBottom()));
}

export const TheCaretStaysClearOfTheBar: Story = {
  args: { content: LONG_BODY },
  decorators: [aWidePage],
  play: async ({ canvas }) => {
    await expectTheCaretToStayClearOfTheBar(canvas);
  },
};

export const TheCaretStaysClearOfTheTallerBarOfANarrowerPage: Story = {
  args: { content: LONG_BODY },
  decorators: [aNarrowerPage],
  play: async ({ canvas }) => {
    await expectTheCaretToStayClearOfTheBar(canvas);
  },
};

export const OnAPhoneTheCaretNeedsNoRoomForTheBarThatScrolledAway: Story = {
  args: { content: LONG_BODY },
  globals: { viewport: { value: 'mobile2' } },
  play: async ({ canvas }) => {
    const body = await scrolledDownALongDoc(canvas);
    const editor = editorOf(body);
    const line = body.children[30];
    if (!line) throw new Error('No line 31');
    const scrolledTo = Math.round(window.scrollY + boxOf(line).top - 88);
    window.scrollTo(0, scrolledTo);
    await waitFor(() => expect(window.scrollY).toBe(scrolledTo));
    editor.commands.focus(editor.view.posAtDOM(line, 0), {
      scrollIntoView: false,
    });
    await untilFocused(body);

    editor.commands.scrollIntoView();

    await pause(100);
    await expect(window.scrollY).toBe(scrolledTo);
  },
};

export const TheSlashMenuOpensInFullUnderTheBarOfAScrolledDoc: Story = {
  args: { content: LONG_BODY },
  decorators: [aWidePage],
  play: async ({ canvas, userEvent }) => {
    const body = await scrolledDownALongDoc(canvas);
    const editor = editorOf(body);
    const lineUnderTheBar = [...body.children].find(
      (line) => boxOf(line).top > boxOf(docBar()).bottom,
    );
    if (!lineUnderTheBar) throw new Error('No line under the bar');
    editor.commands.focus(
      editor.view.posAtDOM(lineUnderTheBar, 0) +
        lineUnderTheBar.textContent.length,
      { scrollIntoView: false },
    );
    await untilFocused(body);

    await userEvent.keyboard(' /');

    const menu = await blocksMenu();
    await waitFor(() =>
      expect(boxOf(menu).top).toBeGreaterThanOrEqual(boxOf(docBar()).bottom),
    );
    await expectInsideTheWindow(menu);
    const { top, left } = boxOf(menu);
    await expect(
      menu.contains(document.elementFromPoint(left + 4, top + 4)),
    ).toBe(true);
  },
};

const A_LONG_SHELF = {
  ...SPANISH,
  id: '019a9c3e-0002-7000-8000-000000000002',
  name: 'Spanish for the trip to Andalusia next spring',
};
const A_LONG_DOC = {
  ...VERBS,
  id: '019a9c3e-0102-7000-8000-000000000102',
  shelfId: A_LONG_SHELF.id,
  title: 'Irregular verbs in the present tense, with examples from songs',
};

function withLongNames({ content }: DocEditorStoryArgs) {
  return (
    <DocEditor
      doc={{ id: A_LONG_DOC.id, content, version: 1 }}
      title={A_LONG_DOC.title}
      place={{ doc: A_LONG_DOC, shelf: A_LONG_SHELF }}
      storageHref={STORAGE_HREF}
    />
  );
}

async function expectLongNamesToEndInAnEllipsisBefore(neighbour: Element) {
  const names = [
    within(breadcrumb()).getByRole('link', { name: A_LONG_SHELF.name }),
    within(breadcrumb()).getByText(A_LONG_DOC.title),
  ];

  for (const name of names) {
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    await expect(boxOf(name).right).toBeLessThanOrEqual(boxOf(neighbour).left);
  }
}

const theNarrowestWidePage: Decorator = (Story) => (
  <div className="w-288">
    <Story />
  </div>
);

export const LongNamesEndInAnEllipsisBeforeTheToolbarAndLeaveItOverTheText: Story =
  {
    render: withLongNames,
    decorators: [theNarrowestWidePage],
    play: async ({ canvas }) => {
      const body = await canvas.findByRole('textbox', { name: 'Doc text' });

      await expectLongNamesToEndInAnEllipsisBefore(formattingToolbar());
      await expectTheToolbarCentredOverTheText(body);
    },
  };

export const LongNamesEndInAnEllipsisBeforeTheStatusOfANarrowPage: Story = {
  render: withLongNames,
  decorators: [aNarrowPageBesideTheSidebar],
  play: async () => {
    await expectLongNamesToEndInAnEllipsisBefore(saveStatus());
  },
};

export const TheToolbarFitsTheColumnOfANarrowPageBesideTheSidebar: Story = {
  decorators: [aNarrowPageBesideTheSidebar],
  play: async () => {
    const tops = within(formattingToolbar())
      .getAllByRole('button')
      .map((button) => button.getBoundingClientRect().top);

    await expect(new Set(tops).size).toBe(1);
  },
};

export const OnAPhoneTheHeaderScrollsAwayWithTheText: Story = {
  args: { content: LONG_BODY },
  globals: { viewport: { value: 'mobile2' } },
  play: async ({ canvas }) => {
    await scrolledDownALongDoc(canvas);

    await expect(
      boxOf(canvas.getByRole('link', { name: 'Back to Spanish' })).bottom,
    ).toBeLessThan(0);
  },
};

export const NoToolbarOnAPhone: Story = {
  globals: { viewport: { value: 'mobile2' } },
  play: async ({ canvas }) => {
    await canvas.findByRole('textbox', { name: 'Doc text' });

    await expect(canvas.queryByRole('toolbar')).not.toBeInTheDocument();
  },
};

const SAVED_AFTER_AN_ANSWER_MS = SAVE_AFTER_MS * 3;

function saveStatus() {
  return screen.getByRole('status', { name: '' });
}

function lastSaved() {
  const [save] = mocked(saveDocAction).mock.lastCall ?? [];
  return save;
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showThePage(visibility: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    value: visibility,
    configurable: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

function isLeavingStopped() {
  const leaving = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(leaving);
  return leaving.defaultPrevented;
}

async function openedWithTheCaretAtTheEnd(
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
) {
  const body = await canvas.findByRole('textbox', { name: 'Doc text' });
  await waitFor(() => expect(body).toHaveTextContent('Next: the past tense.'));
  editorOf(body).commands.focus('end');
  await untilFocused(body);
  return body;
}

export const SavesOnceTheTypingPauses: Story = {
  play: async ({ canvas, userEvent }) => {
    await openedWithTheCaretAtTheEnd(canvas);
    await expect(saveStatus()).toHaveTextContent('Saved');

    await userEvent.keyboard(' And the future.');

    await expect(saveStatus()).toHaveTextContent('Saving…');
    await expect(saveDocAction).not.toHaveBeenCalled();
    await waitFor(() => expect(saveDocAction).toHaveBeenCalledOnce(), {
      timeout: SAVED_AFTER_AN_ANSWER_MS,
    });
    await expect(lastSaved()).toMatchObject({ id: VERBS.id, version: 1 });
    await expect(JSON.stringify(lastSaved()?.content)).toContain(
      'Next: the past tense. And the future.',
    );
    await waitFor(() => expect(saveStatus()).toHaveTextContent('Saved'));
  },
};

export const OpeningADocSavesNothingThoughItsBlocksGetIds: Story = {
  play: async ({ canvas }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await waitFor(() =>
      expect(body.querySelector('p')).toHaveAttribute('data-blockid'),
    );

    await pause(SAVED_AFTER_AN_ANSWER_MS);

    await expect(saveDocAction).not.toHaveBeenCalled();
    await expect(saveStatus()).toHaveTextContent('Saved');
  },
};

export const ANewDocSavesNothingUntilSomethingIsTyped: Story = {
  args: { content: null },
  play: async ({ canvas }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await untilFocused(body);

    await pause(SAVED_AFTER_AN_ANSWER_MS);

    await expect(saveDocAction).not.toHaveBeenCalled();
  },
};

export const SendsTheNextSaveOnlyAfterTheAnswer: Story = {
  play: async ({ canvas, userEvent }) => {
    const firstAnswer = Promise.withResolvers<null>();
    mocked(saveDocAction).mockImplementationOnce(async ({ version }) => {
      await firstAnswer.promise;
      return { ok: true, data: { version: version + 1 } };
    });
    await openedWithTheCaretAtTheEnd(canvas);

    await userEvent.keyboard(' Hablaré.');
    await waitFor(() => expect(saveDocAction).toHaveBeenCalledOnce(), {
      timeout: SAVED_AFTER_AN_ANSWER_MS,
    });
    await userEvent.keyboard(' Hablarás.');
    await pause(SAVED_AFTER_AN_ANSWER_MS);
    await expect(saveDocAction).toHaveBeenCalledOnce();

    firstAnswer.resolve(null);

    await waitFor(() => expect(saveDocAction).toHaveBeenCalledTimes(2));
    await expect(lastSaved()?.version).toBe(2);
    await expect(JSON.stringify(lastSaved()?.content)).toContain(
      'Hablaré. Hablarás.',
    );
    await waitFor(() => expect(saveStatus()).toHaveTextContent('Saved'));
  },
};

async function conflicted(
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
  userEvent: Parameters<NonNullable<Story['play']>>[0]['userEvent'],
) {
  mocked(saveDocAction).mockResolvedValue({
    ok: false,
    error: { code: 'CONFLICT' },
  });
  await openedWithTheCaretAtTheEnd(canvas);
  await userEvent.keyboard(' Hablaré.');
  return screen.findByRole(
    'alertdialog',
    { name: 'This doc changed elsewhere' },
    { timeout: SAVED_AFTER_AN_ANSWER_MS },
  );
}

export const AsksWhatToKeepWhenTheDocChangedElsewhere: Story = {
  play: async ({ canvas, userEvent }) => {
    const dialog = await conflicted(canvas, userEvent);

    await expect(dialog).toHaveFocus();
    await expect(isLeavingStopped()).toBe(true);
  },
};

export const TypingOnAsTheQuestionOpensAnswersNothing: Story = {
  play: async ({ canvas, userEvent }) => {
    const dialog = await conflicted(canvas, userEvent);

    await userEvent.keyboard(' Hablaremos{Enter} ');

    await expect(dialog).toBeInTheDocument();
    await expect(saveDocAction).toHaveBeenCalledOnce();
    await expect(getRouter().refresh).not.toHaveBeenCalled();
  },
};

export const KeepMineFetchesTheNewerVersionToSaveOver: Story = {
  play: async ({ canvas, userEvent }) => {
    const dialog = await conflicted(canvas, userEvent);

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Keep mine' }),
    );

    await expect(getRouter().refresh).toHaveBeenCalledOnce();
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(saveStatus()).toHaveTextContent('Saving…');
  },
};

export const ClosingTheConflictDialogPutsTheChoiceOff: Story = {
  play: async ({ canvas, userEvent }) => {
    const dialog = await conflicted(canvas, userEvent);

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(getRouter().refresh).not.toHaveBeenCalled();
    await expect(saveStatus()).toHaveTextContent('Not saved');
  },
};

export const SaysWhenItCannotSaveOfflineAndAsksBeforeLeaving: Story = {
  play: async ({ canvas, userEvent }) => {
    const onLine = spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await openedWithTheCaretAtTheEnd(canvas);

    await userEvent.keyboard(' Hablaré.');

    await waitFor(
      () => expect(saveStatus()).toHaveTextContent('Offline, not saved'),
      { timeout: SAVED_AFTER_AN_ANSWER_MS },
    );
    await expect(saveDocAction).not.toHaveBeenCalled();
    await expect(isLeavingStopped()).toBe(true);

    onLine.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));

    await waitFor(() => expect(saveStatus()).toHaveTextContent('Saved'));
    await expect(saveDocAction).toHaveBeenCalledOnce();
    await expect(isLeavingStopped()).toBe(false);
  },
};

export const SaysWhenStorageIsFullKeepsTheTextAndSavesOnceThereIsRoom: Story = {
  play: async ({ canvas, userEvent }) => {
    mocked(saveDocAction).mockResolvedValue({
      ok: false,
      error: { code: 'STORAGE_FULL' },
    });
    const body = await openedWithTheCaretAtTheEnd(canvas);

    await userEvent.keyboard(' Hablaré.');

    await waitFor(
      () => expect(saveStatus()).toHaveTextContent('Storage full'),
      { timeout: SAVED_AFTER_AN_ANSWER_MS },
    );
    await expect(
      screen.getByText("Storage full — changes aren't saved"),
    ).toBeVisible();
    await expect(
      screen.getByRole('link', { name: 'See what takes space' }),
    ).toHaveAttribute('href', `/docs/${VERBS.id}?settings=storage`);
    await expect(body).toHaveTextContent('Next: the past tense. Hablaré.');
    await expect(isLeavingStopped()).toBe(true);

    mocked(saveDocAction).mockImplementation(({ version }) =>
      Promise.resolve({ ok: true, data: { version: version + 1 } }),
    );
    await userEvent.keyboard(' Hablarás.');

    await waitFor(() => expect(saveStatus()).toHaveTextContent('Saved'), {
      timeout: SAVED_AFTER_AN_ANSWER_MS,
    });
    await expect(
      screen.queryByText("Storage full — changes aren't saved"),
    ).not.toBeInTheDocument();
  },
};

export const LeavingRightAfterTypingNeedsNoQuestion: Story = {
  play: async ({ canvas, userEvent }) => {
    await openedWithTheCaretAtTheEnd(canvas);

    await userEvent.keyboard(' Hablaré.');

    await expect(saveStatus()).toHaveTextContent('Saving…');
    await expect(isLeavingStopped()).toBe(false);
  },
};

export const SavesAtOnceWithKeepaliveWhenThePageIsHidden: Story = {
  play: async ({ canvas, userEvent }) => {
    const fetch = spyOn(window, 'fetch').mockResolvedValue(
      Response.json({ ok: true, data: { version: 2 } }),
    );
    await openedWithTheCaretAtTheEnd(canvas);
    await userEvent.keyboard(' Hablaré.');

    showThePage('hidden');

    await expect(fetch).toHaveBeenCalledOnce();
    await expect(fetch).toHaveBeenCalledWith(
      '/api/docs/save',
      expect.objectContaining({ keepalive: true }),
    );
    await waitFor(() => expect(saveStatus()).toHaveTextContent('Saved'));
    await expect(saveDocAction).not.toHaveBeenCalled();
    showThePage('visible');
  },
};

export const LooksForANewerVersionWhenThePageComesBackWithNothingUnsaved: Story =
  {
    play: async ({ canvas, userEvent }) => {
      await openedWithTheCaretAtTheEnd(canvas);

      showThePage('hidden');
      showThePage('visible');
      await expect(getRouter().refresh).toHaveBeenCalledOnce();

      await userEvent.keyboard(' Hablaré.');
      showThePage('visible');
      await expect(getRouter().refresh).toHaveBeenCalledOnce();
    },
  };
