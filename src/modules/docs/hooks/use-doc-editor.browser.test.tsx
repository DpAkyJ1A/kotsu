import {
  type Editor,
  getSchema,
  type TiptapEditorHTMLElement,
} from '@tiptap/core';
import { Selection } from '@tiptap/pm/state';
import { EditorContent } from '@tiptap/react';
import { describe, expect, onTestFinished, test } from 'vitest';
import { cdp, type Locator, page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { IntlTestProvider } from '@/i18n/testing';

import type { Doc } from '../core/doc';
import { DocKit } from '../core/doc-kit';
import { useDocEditor } from './use-doc-editor';

const SAVED_ID = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f01';
const OTHER_ID = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f02';
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/;
const HINT =
  'Start writing, or type / for blocks. Markdown works too: #\u00a0heading, -\u2060\u00a0list, []\u00a0checklist';
const HINT_IN_RUSSIAN =
  'Начни писать или набери\u00a0/, чтобы выбрать блок. Markdown тоже работает: #\u00a0заголовок, -\u2060\u00a0список, []\u00a0чеклист';
const LINE_HINT = 'Type / for blocks';
const LINE_HINT_IN_RUSSIAN = 'Набери\u00a0/, чтобы выбрать блок';
const BLOCKS = 'p, h1, h2, h3, li, blockquote, pre';
const ROOM_UNDER_THE_TEXT_PX = 240;
const CLICK_SPACING_PX = 12;

function Body({ content }: { content: Doc['content'] }) {
  const editor = useDocEditor(content);
  return (
    <>
      <textarea aria-label="Doc title" />
      <EditorContent editor={editor} />
    </>
  );
}

async function renderBody(content: Doc['content'] = null) {
  const screen = await render(
    <IntlTestProvider>
      <Body content={content} />
    </IntlTestProvider>,
  );
  const body = screen.getByRole('textbox', { name: 'Doc text' });
  await expect.element(body).toBeInTheDocument();
  return body;
}

async function renderNewDoc() {
  const body = await renderBody();
  await expect.element(body).toHaveFocus();
  return body;
}

async function renderNewDocToSwitch() {
  const doc = <Body content={null} />;
  const screen = await render(<IntlTestProvider>{doc}</IntlTestProvider>);
  await expect
    .element(screen.getByRole('textbox', { name: 'Doc text' }))
    .toHaveFocus();

  return async function switchToRussian() {
    await screen.rerender(
      <IntlTestProvider locale="ru">{doc}</IntlTestProvider>,
    );
    const body = screen.getByRole('textbox', { name: 'Текст дока' });
    await expect.element(body).toBeInTheDocument();
    return body;
  };
}

async function onATouchScreen() {
  await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true });
  onTestFinished(async () => {
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
  });
}

async function untilAutofocusCouldHaveRun() {
  await new Promise((resolve) => setTimeout(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

function editorOf(body: Locator) {
  const { editor } = body.element() as TiptapEditorHTMLElement;
  if (!editor) throw new Error('The body has no editor');
  return editor;
}

function countTransactionsOf(editor: Editor) {
  let count = 0;
  editor.on('transaction', () => {
    count += 1;
  });
  return () => count;
}

function attributesOf(types: Record<string, { spec: { attrs?: object } }>) {
  return Object.entries(types).map(([name, { spec }]) => [
    name,
    Object.keys(spec.attrs ?? {}),
  ]);
}

function savedDoc(...paragraphs: [string, string][]): Doc['content'] {
  return {
    type: 'doc',
    content: paragraphs.map(([blockId, text]) => ({
      type: 'paragraph',
      attrs: { blockId },
      content: [{ type: 'text', text }],
    })),
  };
}

function blockIdsIn(body: Locator) {
  return [...body.element().querySelectorAll(BLOCKS)].map(
    (block) => block.getAttribute('data-blockid') ?? '',
  );
}

function leaveRoomUnderTheText(body: Locator) {
  body.element().style.paddingBottom = `${String(ROOM_UNDER_THE_TEXT_PX)}px`;
}

function heightsUnderTheText(body: Locator) {
  const { top, bottom } = body.element().getBoundingClientRect();
  const lastBlock = body.element().lastElementChild;
  const textBottom = lastBlock?.getBoundingClientRect().bottom ?? bottom;
  const heights: number[] = [];
  for (let y = textBottom + 1; y < bottom; y += CLICK_SPACING_PX) {
    heights.push(y - top);
  }
  return heights;
}

function caretWhenTheClickEnds(body: Locator) {
  const caret = { position: -1 };
  body.element().addEventListener(
    'click',
    () => {
      const selection = getSelection();
      if (!selection?.anchorNode) return;
      caret.position = editorOf(body).view.posAtDOM(
        selection.anchorNode,
        selection.anchorOffset,
      );
    },
    { once: true },
  );
  return caret;
}

function lastLineOf(body: Locator) {
  return body.element().querySelector<HTMLElement>(':scope > :last-child');
}

function paragraphsIn(body: Locator) {
  return [...body.element().querySelectorAll('p')].map(
    ({ textContent }) => textContent,
  );
}

describe('Markdown shortcuts', () => {
  test.each([
    ['# ', 'h1'],
    ['## ', 'h2'],
    ['### ', 'h3'],
    ['- ', 'ul:not([data-type]) > li'],
    ['* ', 'ul:not([data-type]) > li'],
    ['1. ', 'ol > li'],
    ['[[] ', 'ul[data-type="taskList"] > li > div'],
    ['[[ ] ', 'ul[data-type="taskList"] > li > div'],
    ['> ', 'blockquote > p'],
    ['``` ', 'pre > code'],
  ])('“%s” starts the block %s', async (shortcut, block) => {
    const body = await renderNewDoc();

    await userEvent.keyboard(`${shortcut}hablar`);

    expect(body.element().querySelector(block)?.textContent).toBe('hablar');
  });

  test('“---” draws a line and goes on below it', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('---hablar');

    expect(body.element().querySelector('hr + p')?.textContent).toBe('hablar');
  });

  test('“####” stays text: headings go down to level 3', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('#### hablar');

    expect(body.element().querySelector('p')?.textContent).toBe('#### hablar');
  });

  test.each([
    ['**hablar**', 'strong'],
    ['*hablar*', 'em'],
    ['~~hablar~~', 's'],
    ['`hablar`', 'code'],
  ])('“%s” marks the word with %s', async (typed, mark) => {
    const body = await renderNewDoc();

    await userEvent.keyboard(`yo ${typed}`);

    expect(body.element().querySelector(`p > ${mark}`)?.textContent).toBe(
      'hablar',
    );
  });

  test('turns a typed checklist item into a box named by its text', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('[[] ');
    await expect
      .element(body.getByRole('checkbox', { name: 'Empty checklist item' }))
      .toBeInTheDocument();

    await userEvent.keyboard('Read a page');
    await expect
      .element(body.getByRole('checkbox', { name: 'Read a page' }))
      .toBeInTheDocument();
  });

  test('Tab puts a checklist item under the one above, as in the other lists', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('[[] Read a page{Enter}{Tab}Look up new words');

    expect(
      body
        .element()
        .querySelector('[data-type="taskList"] [data-type="taskList"] p')
        ?.textContent,
    ).toBe('Look up new words');
  });
});

describe('schema', () => {
  test('is the one the server builds from the same kit', async () => {
    const body = await renderBody();
    const { schema } = editorOf(body);
    const server = getSchema([DocKit]);

    expect(attributesOf(schema.nodes)).toEqual(attributesOf(server.nodes));
    expect(attributesOf(schema.marks)).toEqual(attributesOf(server.marks));
  });
});

describe('opening a doc', () => {
  test('puts the caret in the body of a new doc and shows how to start', async () => {
    const body = await renderNewDoc();

    await expect
      .element(body.element().querySelector('p'))
      .toHaveAttribute('data-placeholder', HINT);
  });

  test('gives the hint to screen readers as the placeholder until there is text', async () => {
    const body = await renderNewDoc();
    await expect.element(body).toHaveAttribute('aria-placeholder', HINT);

    await userEvent.keyboard('h');

    await expect.element(body).not.toHaveAttribute('aria-placeholder');
  });

  test('leaves a new doc without the caret on a touch screen, where only a tap opens the keyboard', async () => {
    await onATouchScreen();
    const body = await renderBody();

    await untilAutofocusCouldHaveRun();
    expect(body.element()).not.toHaveFocus();
    await expect.element(body).toHaveAttribute('aria-placeholder', HINT);
  });

  test('leaves the focus alone when the doc already has text', async () => {
    const body = await renderBody(savedDoc([SAVED_ID, 'hablo']));

    await expect.element(body).toHaveTextContent('hablo');
    await untilAutofocusCouldHaveRun();
    expect(body.element()).not.toHaveFocus();
  });
});

describe('the hint', () => {
  test('of an empty line under text points at the slash menu, and screen readers get no placeholder', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('hablo{Enter}');

    await expect
      .element(lastLineOf(body))
      .toHaveAttribute('data-placeholder', LINE_HINT);
    await expect.element(body).not.toHaveAttribute('aria-placeholder');
  });

  test('of the doc returns once all the text is deleted', async () => {
    const body = await renderNewDoc();
    await userEvent.keyboard('hablo{Enter}');

    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}{Backspace}');

    await expect
      .element(body.element().querySelector('p'))
      .toHaveAttribute('data-placeholder', HINT);
    await expect.element(body).toHaveAttribute('aria-placeholder', HINT);
  });
});

describe('a language switch', () => {
  test('names the body and gives screen readers its hint in the new language', async () => {
    const switchToRussian = await renderNewDocToSwitch();

    const body = await switchToRussian();

    await expect
      .element(body)
      .toHaveAttribute('aria-placeholder', HINT_IN_RUSSIAN);
  });

  test('shows the hint in the new language at once', async () => {
    const switchToRussian = await renderNewDocToSwitch();

    const body = await switchToRussian();

    await expect
      .element(body.element().querySelector('p'))
      .toHaveAttribute('data-placeholder', HINT_IN_RUSSIAN);
  });

  test('hints at the slash menu on an empty line in the new language at once', async () => {
    const switchToRussian = await renderNewDocToSwitch();
    await userEvent.keyboard('hablo{Enter}');

    const body = await switchToRussian();

    await expect
      .element(lastLineOf(body))
      .toHaveAttribute('data-placeholder', LINE_HINT_IN_RUSSIAN);
  });

  test('is not an edit: the doc gets no transaction, so there is nothing to save', async () => {
    const switchToRussian = await renderNewDocToSwitch();
    const transactions = countTransactionsOf(
      editorOf(page.getByRole('textbox', { name: 'Doc text' })),
    );

    const body = await switchToRussian();

    await expect
      .element(body.element().querySelector('p'))
      .toHaveAttribute('data-placeholder', HINT_IN_RUSSIAN);
    expect(transactions()).toBe(0);
  });

  test('names an empty checklist item in the new language', async () => {
    const switchToRussian = await renderNewDocToSwitch();
    await userEvent.keyboard('[[] ');

    const body = await switchToRussian();

    await expect
      .element(body.getByRole('checkbox', { name: 'Пустой пункт чеклиста' }))
      .toBeInTheDocument();
  });

  test('keeps the text, the caret and the undo history', async () => {
    const switchToRussian = await renderNewDocToSwitch();
    await userEvent.keyboard('hablo bien{ArrowLeft}{ArrowLeft}');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');

    const body = await switchToRussian();
    await userEvent.keyboard(',');

    await expect.poll(() => paragraphsIn(body)).toEqual(['hablo, bien']);
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await expect.poll(() => paragraphsIn(body)).toEqual(['hablo bien']);
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await expect.poll(() => paragraphsIn(body)).toEqual(['']);
  });
});

async function renderTwoLinesWithRoomUnderThem() {
  const body = await renderBody(
    savedDoc([SAVED_ID, 'hablo, hablas, habla'], [OTHER_ID, 'como, comes']),
  );
  await expect
    .poll(() => paragraphsIn(body))
    .toEqual(['hablo, hablas, habla', 'como, comes']);
  leaveRoomUnderTheText(body);
  return body;
}

describe('a mouse click under the text', () => {
  test('puts the caret at the end of the text, wherever under it the click lands', async () => {
    const body = await renderTwoLinesWithRoomUnderThem();
    const editor = editorOf(body);
    const end = Selection.atEnd(editor.state.doc).from;

    for (const y of heightsUnderTheText(body)) {
      editor.commands.setTextSelection(1);
      await userEvent.click(body, { position: { x: 2, y } });
      expect(editor.state.selection.from, `${String(y)}px down`).toBe(end);
    }
    await userEvent.keyboard(', come');

    expect(paragraphsIn(body)).toEqual([
      'hablo, hablas, habla',
      'como, comes, come',
    ]);
  });

  test('puts the caret there at once when the click comes back from the title, so the first key lands at the end', async () => {
    const body = await renderTwoLinesWithRoomUnderThem();
    await userEvent.click(body.getByText('como, comes'));
    await userEvent.keyboard('{End}');
    const caret = caretWhenTheClickEnds(body);
    const end = Selection.atEnd(editorOf(body).state.doc).from;
    await userEvent.click(page.getByRole('textbox', { name: 'Doc title' }));

    await userEvent.click(body, {
      position: { x: 2, y: heightsUnderTheText(body).at(-1) ?? 0 },
    });
    expect(caret.position).toBe(end);
    await userEvent.keyboard(', come');

    expect(paragraphsIn(body)).toEqual([
      'hablo, hablas, habla',
      'como, comes, come',
    ]);
  });

  test('leaves a click on the text where it lands', async () => {
    const body = await renderTwoLinesWithRoomUnderThem();
    const startOfTheSecondLine = 'hablo, hablas, habla'.length + 3;

    await userEvent.click(body.getByText('como, comes'), {
      position: { x: 1, y: 4 },
    });

    expect(editorOf(body).state.selection.from).toBe(startOfTheSecondLine);
  });
});

describe('block ids', () => {
  test('gives every block a uuid, the first line of a new doc too', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard(
      '# Verbs{Enter}hablar{Enter}- yo{Enter}tú{Enter}{Enter}> poco a poco',
    );

    const ids = blockIdsIn(body);
    expect(ids).toHaveLength(9);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(UUID);
  });

  test('keeps the ids a saved doc already has', async () => {
    const body = await renderBody(savedDoc([SAVED_ID, 'hablo']));

    await expect.element(body).toHaveTextContent('hablo');
    expect(blockIdsIn(body)).toEqual([SAVED_ID]);
  });

  test('gives ids to the blocks of a doc saved without them', async () => {
    const body = await renderBody({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Verbs' }],
        },
        { type: 'paragraph', content: [{ type: 'text', text: 'hablo' }] },
      ],
    });

    await expect.poll(() => blockIdsIn(body)).toHaveLength(2);
    await expect
      .poll(() => blockIdsIn(body).every((id) => UUID.test(id)))
      .toBe(true);
  });

  test('keeps the id with the text before the caret when Enter splits a block', async () => {
    const body = await renderBody(savedDoc([SAVED_ID, 'hablo hablas']));
    await userEvent.click(body);
    await userEvent.keyboard('{End}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{Enter}');

    const [first, second] = blockIdsIn(body);
    expect(first).toBe(SAVED_ID);
    expect(second).toMatch(UUID);
    expect(second).not.toBe(SAVED_ID);
  });

  test('keeps the id with the text when Enter at its start pushes it down', async () => {
    const body = await renderBody(savedDoc([SAVED_ID, 'hablo']));
    await userEvent.click(body);
    await userEvent.keyboard('{Home}{Enter}');

    expect(body.element().querySelectorAll('p')).toHaveLength(2);
    expect(
      body.element().querySelector(`[data-blockid="${SAVED_ID}"]`)?.textContent,
    ).toBe('hablo');
  });

  test('gives a pasted copy of a block a new id, so no two blocks share one', async () => {
    const body = await renderBody(
      savedDoc([SAVED_ID, 'hablo'], [OTHER_ID, 'hablas']),
    );
    await userEvent.click(body);
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
    await userEvent.copy();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    await userEvent.paste();

    await expect
      .poll(() => paragraphsIn(body))
      .toEqual(['hablo', 'hablas', 'hablo', 'hablas']);
    const ids = blockIdsIn(body);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(ids.slice(0, 2)).toEqual([SAVED_ID, OTHER_ID]);
  });
});
