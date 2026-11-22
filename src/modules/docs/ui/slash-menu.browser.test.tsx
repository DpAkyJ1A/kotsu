import type { TiptapEditorHTMLElement } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import type { Locale } from 'next-intl';
import { describe, expect, test } from 'vitest';
import { type Locator, page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { IntlTestProvider } from '@/i18n/testing';

import type { Doc } from '../core/doc';
import { useDocEditor } from '../hooks/use-doc-editor';

const EVERY_BLOCK = [
  'Text',
  'Heading 1',
  'Heading 2',
  'Heading 3',
  'Bulleted list',
  'Numbered list',
  'Checklist',
  'Quote',
  'Code',
  'Divider',
];

function Body({ content }: { content: Doc['content'] }) {
  const editor = useDocEditor(content);
  return <EditorContent editor={editor} />;
}

async function renderNewDoc(locale: Locale = 'en') {
  const screen = await render(
    <IntlTestProvider locale={locale}>
      <Body content={null} />
    </IntlTestProvider>,
  );
  const body = screen.getByRole('textbox');
  await expect.element(body).toHaveFocus();
  return body;
}

async function renderNewDocToSwitch() {
  const doc = <Body content={null} />;
  const screen = await render(<IntlTestProvider>{doc}</IntlTestProvider>);
  await expect.element(screen.getByRole('textbox')).toHaveFocus();

  return async function switchToRussian() {
    await screen.rerender(
      <IntlTestProvider locale="ru">{doc}</IntlTestProvider>,
    );
    await expect
      .element(screen.getByRole('textbox', { name: 'Текст дока' }))
      .toBeInTheDocument();
  };
}

async function renderDocWithInlineCode() {
  const screen = await render(
    <IntlTestProvider>
      <Body
        content={{
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'yo hablo', marks: [{ type: 'code' }] },
              ],
            },
          ],
        }}
      />
    </IntlTestProvider>,
  );
  const body = screen.getByRole('textbox');
  await expect.element(body).toHaveTextContent('yo hablo');
  await userEvent.click(body);
  const { editor } = body.element() as TiptapEditorHTMLElement;
  editor?.commands.setTextSelection(4);
  return body;
}

function menu() {
  return page.getByRole('listbox', { name: 'Blocks' });
}

function russianMenu() {
  return page.getByRole('listbox', { name: 'Блоки' });
}

function option(label: string) {
  return menu().getByRole('option', { name: new RegExp(`^${label} `) });
}

function optionsIn(listbox: Locator) {
  return listbox.getByRole('option');
}

function whatTheMenuAddedToThePage(listbox: Element) {
  let added = listbox;
  while (added.parentElement && added.parentElement !== document.body) {
    added = added.parentElement;
  }
  return added;
}

function linesOf(body: Locator) {
  return [...body.element().children].map(
    (block) => `${block.tagName.toLowerCase()}:${block.textContent}`,
  );
}

describe('opening', () => {
  test('“/” on an empty line opens the menu with every block, the first one highlighted', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('/');

    await expect.element(menu()).toBeVisible();
    expect(
      optionsIn(menu())
        .elements()
        .map(({ textContent }) => textContent),
    ).toEqual(
      EVERY_BLOCK.map((label) => expect.stringContaining(label) as string),
    );
    await expect
      .element(option('Text'))
      .toHaveAttribute('aria-selected', 'true');
    await expect
      .element(option('Text'))
      .toHaveAccessibleName('Text Just start writing');
    await expect
      .element(body)
      .toHaveAttribute('aria-controls', menu().element().id);
    await expect
      .element(body)
      .toHaveAttribute('aria-activedescendant', option('Text').element().id);
  });

  test('“/” after a space opens the menu', async () => {
    await renderNewDoc();

    await userEvent.keyboard('yo /');

    await expect.element(menu()).toBeVisible();
  });

  test('“/” inside a word, as in “and/or”, stays text', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('and/or');

    await expect.element(body).toHaveTextContent('and/or');
    await expect.element(menu()).not.toBeInTheDocument();
  });

  test('“/” in a code block stays text', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('``` /');

    await expect
      .element(body.element().querySelector('pre'))
      .toHaveTextContent('/');
    await expect.element(menu()).not.toBeInTheDocument();
  });

  test('“/” in inline code stays text', async () => {
    const body = await renderDocWithInlineCode();

    await userEvent.keyboard('/');

    await expect
      .element(body.element().querySelector('code'))
      .toHaveTextContent('yo /hablo');
    await expect.element(menu()).not.toBeInTheDocument();
  });

  test('“/” pasted into inline code stays text', async () => {
    const body = await renderDocWithInlineCode();
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', '/');

    body
      .element()
      .dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true }),
      );
    await userEvent.keyboard('h');

    await expect
      .element(body.element().querySelector('code'))
      .toHaveTextContent('yo /hhablo');
    await expect.element(menu()).not.toBeInTheDocument();
  });
});

describe('searching', () => {
  test('what is typed after “/” narrows the blocks', async () => {
    await renderNewDoc();

    await userEvent.keyboard('/head');
    expect(optionsIn(menu()).elements()).toHaveLength(3);

    await userEvent.keyboard('ing2');
    await expect
      .element(menu().getByRole('option'))
      .toHaveAccessibleName('Heading 2 Medium section heading');
  });

  test('“/h2” finds Heading 2 in Russian too', async () => {
    await renderNewDoc('ru');

    await userEvent.keyboard('/h2');

    await expect
      .element(russianMenu().getByRole('option'))
      .toHaveAccessibleName('Заголовок 2 Средний заголовок раздела');
  });

  test('says when nothing matches, and Enter then starts a new line', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('/zzz');
    await expect
      .element(page.getByRole('status'))
      .toHaveTextContent('No matching blocks');
    await expect.element(page.getByText('No matching blocks')).toBeVisible();
    await expect.element(menu()).not.toBeInTheDocument();
    await expect.element(body).not.toHaveAttribute('aria-activedescendant');

    await userEvent.keyboard('{Enter}');

    expect(linesOf(body)).toEqual(['p:/zzz', 'p:']);
    await expect
      .element(page.getByText('No matching blocks'))
      .not.toBeInTheDocument();
  });
});

describe('a query with spaces', () => {
  test('“/heading 2” finds Heading 2 over its space, and Enter makes it', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('/heading 2');
    await expect
      .element(menu().getByRole('option'))
      .toHaveAccessibleName('Heading 2 Medium section heading');
    await userEvent.keyboard('{Enter}Verbs');

    expect(linesOf(body)).toEqual(['h2:Verbs', 'p:']);
  });

  test('in Russian, “/заг 2” and the English “/heading 2” both find Heading 2', async () => {
    const body = await renderNewDoc('ru');

    await userEvent.keyboard('/заг 2');
    await expect
      .element(russianMenu().getByRole('option'))
      .toHaveAccessibleName('Заголовок 2 Средний заголовок раздела');
    await userEvent.keyboard('{Enter}Verbos{Enter}/heading 2');
    await expect
      .element(russianMenu().getByRole('option'))
      .toHaveAccessibleName('Заголовок 2 Средний заголовок раздела');
    await userEvent.keyboard('{Enter}Tiempos');

    expect(linesOf(body)).toEqual(['h2:Verbos', 'h2:Tiempos', 'p:']);
  });

  test('after a language switch, finds the labels of the new language', async () => {
    const switchToRussian = await renderNewDocToSwitch();

    await switchToRussian();
    await userEvent.keyboard('/заг 2');

    await expect
      .element(russianMenu().getByRole('option'))
      .toHaveAccessibleName('Заголовок 2 Средний заголовок раздела');
  });

  test('a space right after “/” closes the menu and leaves “/ ” as text', async () => {
    const body = await renderNewDoc();
    await userEvent.keyboard('/');
    await expect.element(menu()).toBeVisible();

    await userEvent.keyboard(' ');
    await expect.element(menu()).not.toBeInTheDocument();
    await userEvent.keyboard('yo');

    expect(linesOf(body)).toEqual(['p:/ yo']);
  });

  test('a query that finds nothing closes the menu at the next space and stays text', async () => {
    const body = await renderNewDoc();
    await userEvent.keyboard('/xyz');
    await expect.element(page.getByText('No matching blocks')).toBeVisible();

    await userEvent.keyboard(' ');
    await expect
      .element(page.getByText('No matching blocks'))
      .not.toBeInTheDocument();

    expect(linesOf(body)).toEqual(['p:/xyz ']);
  });

  test('a query with a space closes the menu once it finds nothing, and Backspace does not open it again', async () => {
    const body = await renderNewDoc();
    await userEvent.keyboard('/heading 4');
    await expect.element(menu()).not.toBeInTheDocument();

    await userEvent.keyboard('{Backspace}2{Enter}');

    expect(linesOf(body)).toEqual(['p:/heading 2', 'p:']);
  });

  test('the caret put at the end of an old “/heading 2” leaves the menu closed, so Enter starts a new line', async () => {
    const screen = await render(
      <IntlTestProvider>
        <Body
          content={{
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Verbs /heading 2' }],
              },
            ],
          }}
        />
      </IntlTestProvider>,
    );
    const body = screen.getByRole('textbox');
    await expect.element(body).toHaveTextContent('Verbs /heading 2');
    const { editor } = body.element() as TiptapEditorHTMLElement;
    editor?.commands.focus('end');
    await expect.element(body).toHaveFocus();

    await userEvent.keyboard('{Enter}');

    expect(linesOf(body)).toEqual(['p:Verbs /heading 2', 'p:']);
    await expect.element(menu()).not.toBeInTheDocument();
  });

  test('⌘Z right after a pick through a query with a space brings the query back as text, without the menu', async () => {
    const body = await renderNewDoc();
    await userEvent.keyboard('/heading 2{Enter}');
    expect(linesOf(body)).toEqual(['h2:', 'p:']);

    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await userEvent.keyboard('{Enter}');

    expect(linesOf(body)).toEqual(['p:/heading 2', 'p:']);
    await expect.element(menu()).not.toBeInTheDocument();
  });
});

describe('the keyboard', () => {
  test('↓ and ↑ move the highlight, round from the last to the first, and the text field points at it', async () => {
    const body = await renderNewDoc();
    await userEvent.keyboard('/');

    await userEvent.keyboard('{ArrowDown}');
    const heading1 = option('Heading 1');
    await expect.element(heading1).toHaveAttribute('aria-selected', 'true');
    await expect
      .element(body)
      .toHaveAttribute('aria-activedescendant', heading1.element().id);

    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await expect
      .element(option('Divider'))
      .toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{ArrowDown}');
    await expect
      .element(option('Text'))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('a new search highlights its first block again', async () => {
    await renderNewDoc();
    await userEvent.keyboard('/{ArrowDown}{ArrowDown}');

    await userEvent.keyboard('l');

    await expect
      .element(option('Bulleted list'))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('Enter turns a line with only the query into the highlighted block', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('/h2{Enter}Verbs');

    expect(linesOf(body)).toEqual(['h2:Verbs', 'p:']);
    await expect.element(menu()).not.toBeInTheDocument();
    await expect.element(body).not.toHaveAttribute('aria-controls');
    await expect.element(body).not.toHaveAttribute('aria-activedescendant');
  });

  test('Enter on a line with text puts the block below it, with the caret in it', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('Poco a poco /quote{Enter}se va lejos');

    expect(linesOf(body)).toEqual([
      'p:Poco a poco ',
      'blockquote:se va lejos',
      'p:',
    ]);
  });

  test('keys pressed in one go are each taken: “/h” and Enter pick the first heading', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('/h{Enter}Verbs');

    expect(linesOf(body)).toEqual(['h1:Verbs', 'p:']);
  });

  test('keys pressed in one go are each taken: two ↓ and Enter pick the third block', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('/{ArrowDown}{ArrowDown}{Enter}Verbs');

    expect(linesOf(body)).toEqual(['h2:Verbs', 'p:']);
  });

  test('Enter in an empty list item picks the block instead of ending the list', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('- yo{Enter}/h2{Enter}Verbs');

    expect(linesOf(body)).toEqual(['ul:yo', 'h2:Verbs', 'p:']);
  });

  test('Enter in a checklist item with text picks the block instead of splitting the item', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('[[] Read /todo{Enter}Write');

    await expect
      .element(body.getByRole('checkbox', { name: 'Write' }))
      .not.toBeChecked();
    expect(body.getByRole('checkbox').elements()).toHaveLength(2);
    await expect.element(menu()).not.toBeInTheDocument();
  });

  test('Tab closes the menu, keeps the query as text and nests the list item', async () => {
    const body = await renderNewDoc();
    await userEvent.keyboard('- yo{Enter}/h2');

    await userEvent.keyboard('{Tab}');

    await expect.element(menu()).not.toBeInTheDocument();
    expect(body.element().querySelector('ul ul')).toHaveTextContent('/h2');
    await expect.element(body).toHaveFocus();
  });

  test('Tab outside a list closes the menu and keeps the query as text', async () => {
    const body = await renderNewDoc();
    await userEvent.keyboard('/h2');

    await userEvent.keyboard('{Tab}');

    await expect.element(menu()).not.toBeInTheDocument();
    expect(linesOf(body)).toEqual(['p:/h2']);
  });

  test('Shift+Tab closes the menu, keeps the query as text and lifts the list item', async () => {
    const body = await renderNewDoc();
    await userEvent.keyboard('- yo{Enter}{Tab}/h2');

    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');

    await expect.element(menu()).not.toBeInTheDocument();
    expect(body.element().querySelector('ul ul')).toBeNull();
    expect(linesOf(body)).toEqual(['ul:yo/h2', 'p:']);
  });

  test('a divider leaves the caret in a new line under it', async () => {
    const body = await renderNewDoc();

    await userEvent.keyboard('/hr{Enter}hablo');

    expect(linesOf(body)).toEqual(['hr:', 'p:hablo']);
  });

  test('Escape closes the menu, keeps the query as text, and typing on, a space and a word too, does not open it again', async () => {
    const body = await renderNewDoc();
    await userEvent.keyboard('/head');

    await userEvent.keyboard('{Escape}');
    await expect.element(menu()).not.toBeInTheDocument();
    await userEvent.keyboard('ing 2');
    await expect.element(menu()).not.toBeInTheDocument();
    await userEvent.keyboard('{Enter}');

    expect(linesOf(body)).toEqual(['p:/heading 2', 'p:']);
  });

  test('⌘Z right after a pick brings back the query as text', async () => {
    const body = await renderNewDoc();
    await userEvent.keyboard('Verbs /h2{Enter}');
    expect(linesOf(body)).toEqual(['p:Verbs ', 'h2:', 'p:']);

    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');

    expect(linesOf(body)).toEqual(['p:Verbs /h2']);
  });

  test('Enter that ends a word typed with an input method stays with the input method', async () => {
    const body = await renderNewDoc();
    await userEvent.keyboard('/');
    const element = body.element();

    element.dispatchEvent(
      new CompositionEvent('compositionstart', { bubbles: true }),
    );
    element.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        isComposing: true,
        bubbles: true,
      }),
    );
    element.dispatchEvent(
      new CompositionEvent('compositionend', { bubbles: true }),
    );

    expect(linesOf(body)).toEqual(['p:/']);
    await expect.element(menu()).toBeVisible();
  });
});

describe('closing the doc', () => {
  test('takes an open menu away with the editor, and the next doc opens without one', async () => {
    const screen = await render(
      <IntlTestProvider>
        <Body content={null} />
      </IntlTestProvider>,
    );
    await expect.element(screen.getByRole('textbox')).toHaveFocus();
    await userEvent.keyboard('/');
    await expect.element(menu()).toBeVisible();
    const added = whatTheMenuAddedToThePage(menu().element());

    await screen.unmount();
    expect(added.isConnected).toBe(false);
    await renderNewDoc();

    expect(document.querySelectorAll('[role="listbox"]')).toHaveLength(0);
  });
});

describe('the pointer', () => {
  test('hovering a block highlights it', async () => {
    await renderNewDoc();
    await userEvent.keyboard('/');

    await userEvent.hover(option('Quote'));

    await expect
      .element(option('Quote'))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('a click picks a block and leaves the focus in the text', async () => {
    const body = await renderNewDoc();
    await userEvent.keyboard('/');

    await userEvent.click(option('Checklist'));
    await userEvent.keyboard('Read a page');

    await expect.element(body).toHaveFocus();
    await expect
      .element(body.getByRole('checkbox', { name: 'Read a page' }))
      .toBeInTheDocument();
  });
});
