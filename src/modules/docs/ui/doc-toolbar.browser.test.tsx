import type { JSONContent, TiptapEditorHTMLElement } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import type { Locale } from 'next-intl';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { type Locator, page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { IntlTestProvider } from '@/i18n/testing';
import { isApplePlatform } from '@/ui/shortcut';
import { TooltipProvider } from '@/ui/tooltip';

import type { Doc } from '../core/doc';
import { type Format, markdownOf, SHORTCUTS } from '../core/formats';
import { useDocEditor } from '../hooks/use-doc-editor';
import { DocToolbar } from './doc-toolbar';

const MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

const IS_APPLE = isApplePlatform(navigator.userAgent);

const LABELS: Record<Format, string> = {
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  bold: 'Bold',
  italic: 'Italic',
  strike: 'Strikethrough',
  code: 'Inline code',
  bulletList: 'Bulleted list',
  orderedList: 'Numbered list',
  taskList: 'Checklist',
  blockquote: 'Quote',
  codeBlock: 'Code',
  horizontalRule: 'Divider',
};

const FORMATS: Format[] = [
  'heading1',
  'heading2',
  'heading3',
  'bold',
  'italic',
  'strike',
  'code',
  'bulletList',
  'orderedList',
  'taskList',
  'blockquote',
  'codeBlock',
  'horizontalRule',
];

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

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

function list(type: string, item: string, ...items: string[]): JSONContent {
  return {
    type,
    content: [item, ...items].map((line) => ({
      type: type === 'taskList' ? 'taskItem' : 'listItem',
      content: [paragraph(text(line))],
    })),
  };
}

function docOf(...content: JSONContent[]): JSONContent {
  return { type: 'doc', content };
}

function Body({ content }: { content: Doc['content'] }) {
  const editor = useDocEditor(content);
  return (
    <TooltipProvider delayDuration={0}>
      <DocToolbar editor={editor} />
      <input aria-label="Doc title" />
      <EditorContent editor={editor} />
    </TooltipProvider>
  );
}

async function renderDoc(content: Doc['content'], locale: Locale = 'en') {
  const screen = await render(
    <IntlTestProvider locale={locale}>
      <Body content={content} />
    </IntlTestProvider>,
  );
  const body = screen.getByRole('textbox', { name: /^(Doc text|Текст дока)$/ });
  await expect.element(body).toBeInTheDocument();
  return body;
}

function editorOf(body: Locator) {
  const { editor } = body.element() as TiptapEditorHTMLElement;
  if (!editor) throw new Error('The body has no editor');
  return editor;
}

function positionOf(body: Locator, wanted: string) {
  let found = -1;
  editorOf(body).state.doc.descendants((node, pos) => {
    const index = node.isText ? (node.text ?? '').indexOf(wanted) : -1;
    if (found === -1 && index !== -1) found = pos + index;
  });
  return found;
}

async function caretIn(body: Locator, word: string) {
  editorOf(body)
    .chain()
    .focus()
    .setTextSelection(positionOf(body, word) + 1)
    .run();
  await expect.element(body).toHaveFocus();
}

async function select(body: Locator, word: string) {
  const from = positionOf(body, word);
  editorOf(body)
    .chain()
    .focus()
    .setTextSelection({ from, to: from + word.length })
    .run();
  await expect.element(body).toHaveFocus();
}

function toolbar() {
  return page.getByRole('toolbar', { name: 'Formatting' });
}

function button(format: Format) {
  return toolbar().getByRole('button', { name: LABELS[format], exact: true });
}

function pressedButtons() {
  return toolbar()
    .getByRole('button', { pressed: true })
    .elements()
    .map((element) => element.getAttribute('aria-label'));
}

function linesOf(body: Locator) {
  return [...body.element().children].map(
    (block) => `${block.tagName.toLowerCase()}:${block.textContent}`,
  );
}

async function expectTooltip(trigger: Locator, content: string) {
  await userEvent.hover(trigger);
  await expect.element(page.getByRole('tooltip')).toHaveTextContent(content);
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('tooltip')).not.toBeInTheDocument();
}

function keysToPress(binding: string) {
  const keys = binding.split('-');
  const key = keys.pop() ?? '';
  const held = keys.map((modifier) =>
    modifier === 'Mod' ? (IS_APPLE ? 'Meta' : 'Control') : modifier,
  );
  const press = held.map((modifier) => `{${modifier}>}`).join('');
  const release = held
    .toReversed()
    .map((modifier) => `{/${modifier}}`)
    .join('');
  return `${press}${key}${release}`;
}

function typed(value: string) {
  return value.replace(/[[{]/g, '$&$&');
}

describe('a button', () => {
  test('of a block turns the line into that block and lights up; a second press turns the line back into text', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await caretIn(body, 'hablo');

    await userEvent.click(button('heading2'));

    expect(linesOf(body)).toEqual(['h2:yo hablo', 'p:']);
    await expect
      .element(button('heading2'))
      .toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(button('heading2'));

    expect(linesOf(body)).toEqual(['p:yo hablo', 'p:']);
    await expect
      .element(button('heading2'))
      .toHaveAttribute('aria-pressed', 'false');
  });

  test('of a mark marks the selected text and lights up', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await select(body, 'hablo');

    await userEvent.click(button('bold'));

    expect(body.element().querySelector('strong')?.textContent).toBe('hablo');
    await expect
      .element(button('bold'))
      .toHaveAttribute('aria-pressed', 'true');
    await expect.element(body).toHaveFocus();
  });

  test('lights up while the caret is in its block or mark, and no other does', async () => {
    const body = await renderDoc(
      docOf(
        paragraph(
          text('plain '),
          text('strong', 'bold'),
          text(' '),
          text('slanted', 'italic'),
          text(' '),
          text('struck', 'strike'),
          text(' '),
          text('typed', 'code'),
        ),
        heading(1, 'Present'),
        heading(2, 'Hablar'),
        heading(3, 'Week'),
        list('bulletList', 'bullet'),
        list('orderedList', 'numbered'),
        list('taskList', 'ticked'),
        { type: 'blockquote', content: [paragraph(text('quoted'))] },
        { type: 'codeBlock', content: [text('snippet')] },
      ),
    );

    for (const [word, lit] of [
      ['plain', []],
      ['strong', ['Bold']],
      ['slanted', ['Italic']],
      ['struck', ['Strikethrough']],
      ['typed', ['Inline code']],
      ['Present', ['Heading 1']],
      ['Hablar', ['Heading 2']],
      ['Week', ['Heading 3']],
      ['bullet', ['Bulleted list']],
      ['numbered', ['Numbered list']],
      ['ticked', ['Checklist']],
      ['quoted', ['Quote']],
      ['snippet', ['Code']],
    ] as const) {
      await caretIn(body, word);
      await expect.poll(pressedButtons, { message: word }).toEqual(lit);
    }
  });

  test('of the divider is not a toggle: it puts a divider under the line and the caret under it', async () => {
    const body = await renderDoc(
      docOf(paragraph(text('yo hablo')), paragraph(text('tú'))),
    );
    await expect
      .element(button('horizontalRule'))
      .not.toHaveAttribute('aria-pressed');
    await caretIn(body, 'hablo');

    await userEvent.click(button('horizontalRule'));
    await userEvent.keyboard('él');

    expect(linesOf(body)).toEqual(['p:yo hablo', 'hr:', 'p:él', 'p:tú']);
  });

  test('pressed while the title has the focus acts on the text where its caret was and gives the text the focus', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await caretIn(body, 'hablo');
    await userEvent.click(page.getByRole('textbox', { name: 'Doc title' }));
    await expect.element(body).not.toHaveFocus();

    await userEvent.click(button('heading1'));
    await expect.element(body).toHaveFocus();
    await userEvent.keyboard('!');

    expect(linesOf(body)).toEqual(['h1:yo h!ablo', 'p:']);
  });

  test('of the divider pressed while the title has the focus puts it under the line where the caret was', async () => {
    const body = await renderDoc(
      docOf(paragraph(text('yo hablo')), paragraph(text('tú'))),
    );
    await caretIn(body, 'hablo');
    await userEvent.click(page.getByRole('textbox', { name: 'Doc title' }));

    await userEvent.click(button('horizontalRule'));
    await expect.element(body).toHaveFocus();
    await userEvent.keyboard('él');

    expect(linesOf(body)).toEqual(['p:yo hablo', 'hr:', 'p:él', 'p:tú']);
  });

  test('clicked never takes the focus from the text, so the selection stays lit', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await select(body, 'hablo');
    const blurs = vi.fn();
    body.element().addEventListener('focusout', blurs);

    await userEvent.click(button('italic'));
    await userEvent.click(button('heading2'));

    expect(blurs).not.toHaveBeenCalled();
    await expect.element(body).toHaveFocus();
  });

  test('that does not apply where the caret is turns off, and the arrow keys pass it by', async () => {
    const body = await renderDoc(
      docOf({ type: 'codeBlock', content: [text('hablar')] }),
    );
    await caretIn(body, 'hablar');

    for (const mark of ['bold', 'italic', 'strike', 'code'] as const) {
      await expect.element(button(mark)).toBeDisabled();
    }
    await expect.element(button('heading2')).toBeEnabled();

    button('heading3').element().focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(button('bulletList')).toHaveFocus();
  });

  test('of a heading stays enabled in a list item, where the quote is off, and makes a heading out of the list', async () => {
    const body = await renderDoc(docOf(list('bulletList', 'yo', 'tú')));
    await caretIn(body, 'yo');

    await expect.element(button('heading2')).toBeEnabled();
    await expect.element(button('blockquote')).toBeDisabled();
    await userEvent.click(button('heading2'));

    expect(linesOf(body)).toEqual(['h2:yo', 'ul:tú', 'p:']);
  });
});

test('the toolbar has a button for every format: headings, marks, colours, lists, then the other blocks', async () => {
  await renderDoc(null);

  const names = toolbar()
    .getByRole('button')
    .elements()
    .map((element) => element.getAttribute('aria-label'));

  expect(names).toEqual([
    ...FORMATS.slice(0, 7).map((format) => LABELS[format]),
    'Colour',
    'Last colour: red text',
    ...FORMATS.slice(7).map((format) => LABELS[format]),
  ]);
});

test('a doc that opens on a heading lights that heading before anything is clicked', async () => {
  await renderDoc({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1, blockId: '9b1f3c2e-6a4d-4f0e-9c7b-2d5e8a1f0c11' },
        content: [text('Present tense')],
      },
      {
        type: 'paragraph',
        attrs: { blockId: '9b1f3c2e-6a4d-4f0e-9c7b-2d5e8a1f0c12' },
        content: [text('yo hablo')],
      },
    ],
  });

  await expect
    .element(button('heading1'))
    .toHaveAttribute('aria-pressed', 'true');
});

describe('the keyboard', () => {
  test('reaches the toolbar over the title with one Tab; arrows, Home and End move along it, round from end to end', async () => {
    await renderDoc(docOf(paragraph(text('yo hablo'))));
    const title = page.getByRole('textbox', { name: 'Doc title' });
    await userEvent.click(title);

    await userEvent.tab({ shift: true });
    await expect.element(button('heading1')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(button('heading2')).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect.element(button('horizontalRule')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(button('heading1')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(button('horizontalRule')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect.element(button('heading1')).toHaveFocus();

    await userEvent.tab();
    await expect.element(title).toHaveFocus();
  });

  test('Enter on a button applies it to the text and goes back to the text', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await caretIn(body, 'hablo');
    button('blockquote').element().focus();

    await userEvent.keyboard('{Enter}');

    await expect.element(body).toHaveFocus();
    expect(linesOf(body)).toEqual(['blockquote:yo hablo', 'p:']);
  });
});

describe('a tooltip', () => {
  test('on a Mac says the name, the keys with ⌘ and the Markdown', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(MAC);
    await renderDoc(docOf(paragraph(text('yo hablo'))));

    await expectTooltip(button('heading2'), 'Heading 2 ⌘⌥2 ##');
    await expectTooltip(button('bold'), 'Bold ⌘B **text**');
    await expectTooltip(button('strike'), 'Strikethrough ⌘⇧S ~~text~~');
  });

  test('on Windows and Linux says Ctrl', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(WINDOWS);
    await renderDoc(docOf(paragraph(text('yo hablo'))));

    await expectTooltip(button('heading2'), 'Heading 2 Ctrl Alt 2 ##');
    await expectTooltip(button('bold'), 'Bold Ctrl B **text**');
    await expectTooltip(
      button('strike'),
      'Strikethrough Ctrl Shift S ~~text~~',
    );
  });

  test('of the divider has only its Markdown: it has no shortcut', async () => {
    await renderDoc(docOf(paragraph(text('yo hablo'))));

    await expectTooltip(button('horizontalRule'), 'Divider ---');
  });

  test('opens on focus too, and describes the button', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(MAC);
    await renderDoc(docOf(paragraph(text('yo hablo'))));
    await userEvent.click(page.getByRole('textbox', { name: 'Doc title' }));

    await userEvent.tab({ shift: true });

    await expect.element(page.getByRole('tooltip')).toBeVisible();
    await expect
      .element(button('heading1'))
      .toHaveAccessibleDescription('Heading 1 ⌘⌥1 #');
  });

  test('in Russian takes the slash menu’s names and a Russian sample word', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(MAC);
    await renderDoc(docOf(paragraph(text('yo hablo'))), 'ru');
    const russian = page.getByRole('toolbar', { name: 'Форматирование' });

    await expectTooltip(
      russian.getByRole('button', { name: 'Заголовок 2' }),
      'Заголовок 2 ⌘⌥2 ##',
    );
    await expectTooltip(
      russian.getByRole('button', { name: 'Жирный' }),
      'Жирный ⌘B **текст**',
    );
  });
});

describe('what a tooltip promises', () => {
  test.each(FORMATS.filter((format) => SHORTCUTS[format].keys))(
    'the shortcut of %s does what its button does',
    async (format) => {
      const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
      await select(body, 'hablo');

      await userEvent.keyboard(keysToPress(SHORTCUTS[format].keys ?? ''));

      await expect
        .element(button(format))
        .toHaveAttribute('aria-pressed', 'true');
    },
  );

  test.each(FORMATS.filter((format) => format !== 'horizontalRule'))(
    'the Markdown of %s makes what its button makes',
    async (format) => {
      const body = await renderDoc(null);
      await expect.element(body).toHaveFocus();

      const markdown = markdownOf(format, 'hablo');
      await userEvent.keyboard(
        markdown.includes('hablo')
          ? `${typed(markdown)}{ArrowLeft}{ArrowLeft}`
          : `${typed(markdown)} hablo`,
      );

      await expect
        .element(button(format))
        .toHaveAttribute('aria-pressed', 'true');
    },
  );

  test('the Markdown of the divider makes a divider', async () => {
    const body = await renderDoc(null);
    await expect.element(body).toHaveFocus();

    await userEvent.keyboard(markdownOf('horizontalRule', 'hablo'));

    expect(linesOf(body)[0]).toBe('hr:');
  });
});

function colouredText(
  value: string,
  attrs: { color?: string; backgroundColor?: string },
): JSONContent {
  return {
    type: 'text',
    text: value,
    marks: [
      {
        type: 'textStyle',
        attrs: { color: null, backgroundColor: null, ...attrs },
      },
    ],
  };
}

function colourButton() {
  return toolbar().getByRole('button', { name: 'Colour', exact: true });
}

function lastColourButton() {
  return toolbar().getByRole('button', { name: /^Last colour/ });
}

function row(name: 'Text' | 'Background') {
  return page.getByRole('radiogroup', { name });
}

function swatch(rowName: 'Text' | 'Background', name: string) {
  return row(rowName).getByRole('radio', { name, exact: true });
}

function swatchNames(rowName: 'Text' | 'Background') {
  return row(rowName)
    .getByRole('radio')
    .elements()
    .map((element) => element.getAttribute('aria-label'));
}

function checkedSwatch(rowName: 'Text' | 'Background') {
  return row(rowName)
    .getByRole('radio', { checked: true })
    .element()
    .getAttribute('aria-label');
}

function colouredSpans(body: Locator) {
  return [
    ...body
      .element()
      .querySelectorAll<HTMLElement>('span[data-color], span[data-bg]'),
  ].map(
    ({ textContent, dataset }) =>
      `${textContent}:${dataset.color ?? '-'}/${dataset.bg ?? '-'}`,
  );
}

async function pickColours(...picks: ['Text' | 'Background', string][]) {
  await userEvent.click(colourButton());
  for (const [rowName, name] of picks) {
    await userEvent.click(swatch(rowName, name));
  }
  await userEvent.keyboard('{Escape}');
  await expect.element(row('Text')).not.toBeInTheDocument();
}

describe('colours', () => {
  test('the Colour button opens a row of text colours and a row of backgrounds, Default first, the colours at the caret checked', async () => {
    const body = await renderDoc(
      docOf(
        paragraph(
          text('yo '),
          colouredText('hablo', { color: 'blue', backgroundColor: 'yellow' }),
        ),
      ),
    );
    await caretIn(body, 'hablo');

    await userEvent.click(colourButton());

    const names = [
      'Default',
      'Gray',
      'Brown',
      'Orange',
      'Yellow',
      'Green',
      'Blue',
      'Purple',
      'Pink',
      'Red',
    ];
    await expect
      .element(page.getByRole('dialog', { name: 'Colour' }))
      .toBeVisible();
    expect(swatchNames('Text')).toEqual(names);
    expect(swatchNames('Background')).toEqual(names);
    expect(checkedSwatch('Text')).toBe('Blue');
    expect(checkedSwatch('Background')).toBe('Yellow');

    await userEvent.keyboard('{Escape}');
    await caretIn(body, 'yo');
    await userEvent.click(colourButton());

    expect(checkedSwatch('Text')).toBe('Default');
    expect(checkedSwatch('Background')).toBe('Default');
  });

  test('a swatch colours the selected text and leaves the popover open for the other row', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await select(body, 'hablo');
    await userEvent.click(colourButton());

    await userEvent.click(swatch('Text', 'Red'));

    expect(colouredSpans(body)).toEqual(['hablo:red/-']);
    await expect
      .element(swatch('Text', 'Red'))
      .toHaveAttribute('aria-checked', 'true');

    await userEvent.click(swatch('Background', 'Yellow'));

    expect(colouredSpans(body)).toEqual(['hablo:red/yellow']);
    await expect
      .element(swatch('Background', 'Yellow'))
      .toHaveAttribute('aria-checked', 'true');
  });

  test('the swatch checked for the start of a selection in two colours still colours all of it', async () => {
    const body = await renderDoc(
      docOf(paragraph(colouredText('la', { color: 'red' }), text(' mesa'))),
    );
    const from = positionOf(body, 'la');
    editorOf(body)
      .chain()
      .focus()
      .setTextSelection({ from, to: from + 'la mesa'.length })
      .run();
    await expect.element(body).toHaveFocus();
    await userEvent.click(colourButton());
    await expect
      .element(swatch('Text', 'Red'))
      .toHaveAttribute('aria-checked', 'true');

    await userEvent.click(swatch('Text', 'Red'));

    expect(colouredSpans(body)).toEqual(['la mesa:red/-']);
  });

  test('Default takes off the colour of its row and leaves the other', async () => {
    const body = await renderDoc(
      docOf(
        paragraph(
          colouredText('hablo', { color: 'blue', backgroundColor: 'yellow' }),
        ),
      ),
    );
    await select(body, 'hablo');
    await userEvent.click(colourButton());

    await userEvent.click(swatch('Text', 'Default'));

    expect(colouredSpans(body)).toEqual(['hablo:-/yellow']);

    await userEvent.click(swatch('Background', 'Default'));

    expect(colouredSpans(body)).toEqual([]);
    expect(body.element().querySelector('span')).toBeNull();
  });

  test('from the keyboard: Enter opens it on the checked swatch, the arrows move, Enter picks, Escape gives the text back the focus and the selection', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await select(body, 'hablo');
    colourButton().element().focus();

    await userEvent.keyboard('{Enter}');
    await expect.element(swatch('Text', 'Default')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(swatch('Text', 'Gray')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(swatch('Text', 'Brown')).toHaveFocus();
    expect(colouredSpans(body)).toEqual([]);

    await userEvent.keyboard('{Enter}');
    expect(colouredSpans(body)).toEqual(['hablo:brown/-']);

    await userEvent.tab();
    await expect.element(swatch('Background', 'Default')).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect.element(swatch('Background', 'Red')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(colouredSpans(body)).toEqual(['hablo:brown/red']);

    await userEvent.keyboard('{Escape}');

    await expect.element(row('Text')).not.toBeInTheDocument();
    await expect.element(body).toHaveFocus();
    expect(getSelection()?.toString()).toBe('hablo');
  });

  test('one Escape closes it, wherever the arrows left the focus', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await select(body, 'hablo');
    colourButton().element().focus();
    await userEvent.keyboard('{Enter}');
    await expect.element(swatch('Text', 'Default')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(swatch('Text', 'Red')).toHaveFocus();

    await userEvent.keyboard('{Escape}');

    await expect.element(row('Text')).not.toBeInTheDocument();
    await expect.element(body).toHaveFocus();
    expect(colouredSpans(body)).toEqual([]);
  });

  test('the Colour button pressed while the title has the focus colours the text where its selection was, and closing gives the text the focus', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await select(body, 'hablo');
    await userEvent.click(page.getByRole('textbox', { name: 'Doc title' }));

    await pickColours(['Text', 'Green']);

    expect(colouredSpans(body)).toEqual(['hablo:green/-']);
    await expect.element(body).toHaveFocus();
  });

  test('the focus moving out of the popover closes it, and the focus stays where it moved', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await select(body, 'hablo');
    await userEvent.click(colourButton());
    const title = page.getByRole('textbox', { name: 'Doc title' });

    title.element().focus();

    await expect.element(row('Text')).not.toBeInTheDocument();
    await expect.element(title).toHaveFocus();
  });

  test('a click outside on nothing that takes the focus gives it back to the text', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await select(body, 'hablo');
    await userEvent.click(colourButton());

    await userEvent.click(page.elementLocator(document.documentElement), {
      position: { x: 200, y: 700 },
    });

    await expect.element(row('Text')).not.toBeInTheDocument();
    await expect.element(body).toHaveFocus();
  });

  test('the last colour is red text before the first pick, and its button colours the selection without taking the focus', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await select(body, 'hablo');
    await expect
      .element(lastColourButton())
      .toHaveAccessibleName('Last colour: red text');
    await expect
      .element(lastColourButton())
      .not.toHaveAttribute('aria-pressed');

    await userEvent.click(lastColourButton());

    expect(colouredSpans(body)).toEqual(['hablo:red/-']);
    await expect.element(body).toHaveFocus();
  });

  test('what was picked in one opening, text and background, is the last colour', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await select(body, 'yo');

    await pickColours(['Text', 'Blue'], ['Background', 'Yellow']);
    await select(body, 'hablo');
    await userEvent.click(lastColourButton());

    expect(colouredSpans(body)).toEqual([
      'yo:blue/yellow',
      'hablo:blue/yellow',
    ]);
    await expect
      .element(lastColourButton())
      .toHaveAccessibleName('Last colour: blue text, yellow background');
  });

  test('a new opening starts the last colour afresh, so a background alone leaves the text colour as it is', async () => {
    const body = await renderDoc(
      docOf(paragraph(text('yo '), colouredText('hablo', { color: 'pink' }))),
    );
    await select(body, 'yo');
    await pickColours(['Text', 'Blue']);
    await pickColours(['Background', 'Yellow']);

    await select(body, 'hablo');
    await userEvent.click(lastColourButton());

    expect(colouredSpans(body)).toEqual([
      'yo:blue/yellow',
      'hablo:pink/yellow',
    ]);
    await expect
      .element(lastColourButton())
      .toHaveAccessibleName('Last colour: yellow background');
  });

  test('a Default picked is not a colour, so the last colour stays', async () => {
    const body = await renderDoc(
      docOf(paragraph(colouredText('hablo', { color: 'blue' }))),
    );
    await select(body, 'hablo');

    await pickColours(['Text', 'Default']);

    await expect
      .element(lastColourButton())
      .toHaveAccessibleName('Last colour: red text');
  });

  test('the last colour is kept on this device, so a doc opened later starts with it', async () => {
    const first = await render(
      <IntlTestProvider locale="en">
        <Body content={docOf(paragraph(text('yo hablo')))} />
      </IntlTestProvider>,
    );
    const body = first.getByRole('textbox', { name: 'Doc text' });
    await select(body, 'hablo');
    await pickColours(['Background', 'Green']);
    await first.unmount();

    await renderDoc(docOf(paragraph(text('tú hablas'))));

    await expect
      .element(lastColourButton())
      .toHaveAccessibleName('Last colour: green background');
  });

  test('without storage on the device, colours still work and the last colour stays red text', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await select(body, 'yo');

    await pickColours(['Text', 'Blue']);
    await select(body, 'hablo');
    await userEvent.click(lastColourButton());

    expect(colouredSpans(body)).toEqual(['yo:blue/-', 'hablo:red/-']);
  });

  test('both buttons turn off in a code block and in inline code, which take no colour', async () => {
    const body = await renderDoc(
      docOf(paragraph(text('yo '), text('hablo', 'code')), {
        type: 'codeBlock',
        content: [text('tú hablas')],
      }),
    );

    for (const word of ['hablo', 'hablas']) {
      await caretIn(body, word);
      await expect.element(colourButton()).toBeDisabled();
      await expect.element(lastColourButton()).toBeDisabled();
    }
    await caretIn(body, 'yo');
    await expect.element(colourButton()).toBeEnabled();
  });

  test('the tooltip of the last colour says its colour and its shortcut', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(MAC);
    await renderDoc(docOf(paragraph(text('yo hablo'))));

    await expectTooltip(lastColourButton(), 'Last colour: red text ⌘⇧H');
    await expectTooltip(colourButton(), 'Colour');
  });

  test('its shortcut colours the selection with the last colour', async () => {
    const body = await renderDoc(docOf(paragraph(text('yo hablo'))));
    await select(body, 'yo');
    await pickColours(['Text', 'Purple']);
    await select(body, 'hablo');

    await userEvent.keyboard(keysToPress(SHORTCUTS.lastColour.keys));

    expect(colouredSpans(body)).toEqual(['yo:purple/-', 'hablo:purple/-']);
  });

  test('in Russian names the rows, the colours and the last colour in Russian', async () => {
    await renderDoc(docOf(paragraph(text('yo hablo'))), 'ru');
    const russian = page.getByRole('toolbar', { name: 'Форматирование' });

    await expect
      .element(
        russian.getByRole('button', { name: 'Последний цвет: красный текст' }),
      )
      .toBeInTheDocument();
    await userEvent.click(
      russian.getByRole('button', { name: 'Цвет', exact: true }),
    );

    await expect
      .element(
        page
          .getByRole('radiogroup', { name: 'Фон' })
          .getByRole('radio', { name: 'Жёлтый' }),
      )
      .toBeInTheDocument();
  });
});
