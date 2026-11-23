import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { getRouter } from '@storybook/nextjs-vite/navigation.mock';
import type { JSONContent, TiptapEditorHTMLElement } from '@tiptap/core';
import { expect, mocked, screen, spyOn, waitFor, within } from 'storybook/test';

import { DocBreadcrumb, ShelvesProvider } from '@/modules/shelves';
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
      breadcrumb={<DocBreadcrumb doc={VERBS} shelf={SPANISH} />}
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

export const TheToolbarSitsBetweenTheHeaderAndTheTitle: Story = {
  play: async ({ canvas }) => {
    const toolbar = formattingToolbar();
    const title = canvas.getByRole('textbox', { name: 'Doc title' });

    await expect(toolbar.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      title.getBoundingClientRect().top,
    );
  },
};

export const TheToolbarStaysAtTheTopOfTheWindow: Story = {
  args: { content: LONG_BODY },
  play: async ({ canvas }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await waitFor(() => expect(body).toHaveTextContent('Line 60'));
    const toolbar = formattingToolbar();
    const title = canvas.getByRole('textbox', { name: 'Doc title' });

    window.scrollTo(0, 800);

    await waitFor(() => expect(toolbar.getBoundingClientRect().top).toBe(0));
    await expect(title.getBoundingClientRect().bottom).toBeLessThan(0);
  },
};

export const TheCaretStaysClearOfTheToolbar: Story = {
  args: { content: LONG_BODY },
  play: async ({ canvas }) => {
    const body = await canvas.findByRole('textbox', { name: 'Doc text' });
    await waitFor(() => expect(body).toHaveTextContent('Line 60'));
    const editor = editorOf(body);
    const toolbarBottom = () =>
      formattingToolbar().getBoundingClientRect().bottom;
    const caretTop = () =>
      editor.view.coordsAtPos(editor.state.selection.from).top;
    window.scrollTo(0, 1200);
    const lineUnderTheToolbar = [...body.children].find(
      (line) => line.getBoundingClientRect().top > 0,
    );
    if (!lineUnderTheToolbar) throw new Error('No line in the window');
    editor.commands.focus(editor.view.posAtDOM(lineUnderTheToolbar, 0), {
      scrollIntoView: false,
    });
    await untilFocused(body);
    await expect(caretTop()).toBeLessThan(toolbarBottom());

    editor.commands.scrollIntoView();

    await waitFor(() =>
      expect(caretTop()).toBeGreaterThanOrEqual(toolbarBottom()),
    );
  },
};

export const TheToolbarFitsTheColumnOfANarrowWindowWithTheSidebar: Story = {
  decorators: [
    (Story) => (
      <div className="w-132">
        <Story />
      </div>
    ),
  ],
  play: async () => {
    const tops = within(formattingToolbar())
      .getAllByRole('button')
      .map((button) => button.getBoundingClientRect().top);

    await expect(new Set(tops).size).toBe(1);
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
