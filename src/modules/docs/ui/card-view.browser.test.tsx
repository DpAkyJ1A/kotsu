import type { JSONContent, TiptapEditorHTMLElement } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import type { Locale } from 'next-intl';
import { describe, expect, test } from 'vitest';
import { type Locator, page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { IntlTestProvider } from '@/i18n/testing';
import { isApplePlatform } from '@/ui/shortcut';
import { TooltipProvider } from '@/ui/tooltip';

import { toggleTheCard } from '../core/card-commands';
import type { CardStatuses } from '../core/card-status';
import type { Doc } from '../core/doc';
import { useDocEditor } from '../hooks/use-doc-editor';
import { CardStatusesContext } from './card-statuses';
import { DocToolbar } from './doc-toolbar';

const MOD = isApplePlatform(navigator.userAgent) ? 'Meta' : 'Control';
const TOGGLE_THE_CARD = `{${MOD}>}{Shift>}{Enter}{/Shift}{/${MOD}}`;

const CARD_ID = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f01';
const OTHER_CARD_ID = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f02';

function text(value: string): JSONContent[] {
  return value ? [{ type: 'text', text: value }] : [];
}

function paragraph(value = ''): JSONContent {
  return { type: 'paragraph', ...(value && { content: text(value) }) };
}

function card(
  question: string,
  answer: JSONContent[],
  blockId?: string,
): JSONContent {
  return {
    type: 'details',
    ...(blockId && { attrs: { blockId } }),
    content: [
      { type: 'detailsSummary', ...(question && { content: text(question) }) },
      { type: 'detailsContent', content: answer },
    ],
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
      <EditorContent editor={editor} />
    </TooltipProvider>
  );
}

async function renderDoc(
  content: Doc['content'],
  {
    locale = 'en',
    statuses = {},
  }: { locale?: Locale; statuses?: CardStatuses } = {},
) {
  const screen = await render(
    <IntlTestProvider locale={locale}>
      <CardStatusesContext value={statuses}>
        <Body content={content} />
      </CardStatusesContext>
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

async function caretAfter(body: Locator, word: string) {
  editorOf(body)
    .chain()
    .focus()
    .setTextSelection(positionOf(body, word) + word.length)
    .run();
  await expect.element(body).toHaveFocus();
}

function showAnswer(index = 0) {
  return page.getByRole('button', { name: 'Show answer' }).nth(index);
}

function hideAnswer(index = 0) {
  return page.getByRole('button', { name: 'Hide answer' }).nth(index);
}

function answerOf(body: Locator, index = 0) {
  return body.element().querySelectorAll('[data-type=detailsContent]')[index];
}

function blocksOf(body: Locator) {
  return withoutIds(editorOf(body).getJSON()).content;
}

function withoutIds(node: JSONContent): JSONContent {
  const { attrs, content, ...rest } = node;
  const kept = Object.entries(attrs ?? {}).filter(
    ([name]) => name !== 'blockId',
  );
  return {
    ...rest,
    ...(kept.length > 0 && { attrs: Object.fromEntries(kept) }),
    ...(content && { content: content.map(withoutIds) }),
  };
}

function cardIdsOf(body: Locator) {
  return editorOf(body)
    .getJSON()
    .content.filter(({ type }) => type === 'details')
    .map(({ attrs }) => attrs?.blockId as unknown);
}

describe('making a card', () => {
  test('“/card” makes a closed card, the caret in its question', async () => {
    const body = await renderDoc(null);
    await expect.element(body).toHaveFocus();

    await userEvent.keyboard('/card');
    await userEvent.keyboard('{Enter}Why a new role?');

    expect(blocksOf(body)).toEqual([
      card('Why a new role?', [paragraph()]),
      paragraph(),
    ]);
    await expect
      .element(showAnswer())
      .toHaveAttribute('aria-expanded', 'false');
    expect(answerOf(body)).not.toBeVisible();
    await expect.element(page.getByText('New', { exact: true })).toBeVisible();
  });

  test('Enter in the question opens the answer and moves the caret there', async () => {
    const body = await renderDoc(null);
    await expect.element(body).toHaveFocus();

    await userEvent.keyboard('/card{Enter}Why a new role?{Enter}To grow');

    expect(blocksOf(body)).toEqual([
      card('Why a new role?', [paragraph('To grow')]),
      paragraph(),
    ]);
    expect(answerOf(body)).toBeVisible();
    await expect.element(hideAnswer()).toHaveAttribute('aria-expanded', 'true');
  });

  test('Enter in the question of a card with an answer moves the caret to its start and adds nothing', async () => {
    const body = await renderDoc(
      docOf(card('Why?', [paragraph('To grow')], CARD_ID)),
    );
    await caretAfter(body, 'Why?');

    await userEvent.keyboard('{Enter}So: ');

    expect(blocksOf(body)).toEqual([
      card('Why?', [paragraph('So: To grow')]),
      paragraph(),
    ]);
  });

  test('Enter on the empty last line of the answer leaves the card', async () => {
    const body = await renderDoc(null);
    await expect.element(body).toHaveFocus();

    await userEvent.keyboard('/card{Enter}Q{Enter}A{Enter}{Enter}after');

    expect(blocksOf(body)).toEqual([
      card('Q', [paragraph('A')]),
      paragraph('after'),
    ]);
  });
});

describe('the answer is never left empty', () => {
  test('Enter on the only line of an empty answer starts a second line instead of leaving the card', async () => {
    const body = await renderDoc(null);
    await expect.element(body).toHaveFocus();

    await userEvent.keyboard('/card{Enter}Q{Enter}{Enter}A');

    expect(blocksOf(body)).toEqual([
      card('Q', [paragraph(), paragraph('A')]),
      paragraph(),
    ]);
  });
});

describe('a card from what is already written', () => {
  function selectFrom(body: Locator, first: string, last: string) {
    editorOf(body)
      .chain()
      .focus()
      .setTextSelection({
        from: positionOf(body, first),
        to: positionOf(body, last) + last.length,
      })
      .run();
  }

  test('⌘⇧Enter on two selected lines makes a card of them, open, the first line its question', async () => {
    const body = await renderDoc(
      docOf(paragraph('¿Qué significa hablar?'), paragraph('to speak')),
    );
    selectFrom(body, '¿Qué', 'speak');
    await expect.element(body).toHaveFocus();

    await userEvent.keyboard(TOGGLE_THE_CARD);

    expect(blocksOf(body)).toEqual([
      card('¿Qué significa hablar?', [paragraph('to speak')]),
      paragraph(),
    ]);
    expect(answerOf(body)).toBeVisible();
  });

  test('⌘Z after it brings the lines back', async () => {
    const body = await renderDoc(
      docOf(paragraph('¿Qué significa hablar?'), paragraph('to speak')),
    );
    selectFrom(body, '¿Qué', 'speak');
    await expect.element(body).toHaveFocus();

    await userEvent.keyboard(TOGGLE_THE_CARD);
    await userEvent.keyboard(`{${MOD}>}z{/${MOD}}`);

    expect(blocksOf(body)).toEqual([
      paragraph('¿Qué significa hablar?'),
      paragraph('to speak'),
    ]);
  });

  test('⌘Z right after typing and ⌘⇧Enter undoes only the card, the typing stays', async () => {
    const body = await renderDoc(docOf(paragraph('¿Qué significa')));
    await caretAfter(body, 'significa');

    await userEvent.keyboard(` hablar?${TOGGLE_THE_CARD}{${MOD}>}z{/${MOD}}`);

    expect(blocksOf(body)).toEqual([paragraph('¿Qué significa hablar?')]);
  });

  test('⌘⇧Enter in a line with text makes it the question of a closed card', async () => {
    const body = await renderDoc(docOf(paragraph('¿Qué significa hablar?')));
    await caretAfter(body, 'hablar?');

    await userEvent.keyboard(TOGGLE_THE_CARD);

    expect(blocksOf(body)).toEqual([
      card('¿Qué significa hablar?', [paragraph()]),
      paragraph(),
    ]);
    expect(answerOf(body)).not.toBeVisible();
  });

  test('“?? ” at the start of a line turns it into a card, its text the question', async () => {
    const body = await renderDoc(null);
    await expect.element(body).toHaveFocus();

    await userEvent.keyboard('?? ¿Qué significa hablar?');

    expect(blocksOf(body)).toEqual([
      card('¿Qué significa hablar?', [paragraph()]),
      paragraph(),
    ]);
  });

  test('“?? ” in a list item stays text', async () => {
    const body = await renderDoc(null);
    await expect.element(body).toHaveFocus();

    await userEvent.keyboard('- ?? yo');

    expect(blocksOf(body)).toEqual([
      {
        type: 'bulletList',
        content: [{ type: 'listItem', content: [paragraph('?? yo')] }],
      },
      paragraph(),
    ]);
  });
});

describe('opening and closing', () => {
  test('a doc opens with its cards closed', async () => {
    const body = await renderDoc(
      docOf(card('Why a new role?', [paragraph('To grow')], CARD_ID)),
    );

    await expect.element(showAnswer()).toBeVisible();
    expect(answerOf(body)).not.toBeVisible();
  });

  test('the arrow opens and closes the answer and leaves the caret where it was', async () => {
    const body = await renderDoc(
      docOf(paragraph('Intro'), card('Why?', [paragraph('To grow')], CARD_ID)),
    );
    await caretAfter(body, 'Intro');

    await userEvent.click(showAnswer());
    expect(answerOf(body)).toBeVisible();
    await userEvent.click(hideAnswer());
    expect(answerOf(body)).not.toBeVisible();

    expect(editorOf(body).state.selection.from).toBe(
      positionOf(body, 'Intro') + 'Intro'.length,
    );
  });

  test('⌘⇧Enter closes the card around the caret and takes the caret to its question', async () => {
    const body = await renderDoc(
      docOf(card('Why?', [paragraph('To grow')], CARD_ID)),
    );
    await userEvent.click(showAnswer());
    await caretAfter(body, 'To grow');

    await userEvent.keyboard(TOGGLE_THE_CARD);
    expect(answerOf(body)).not.toBeVisible();
    await userEvent.keyboard('!');

    expect(blocksOf(body)).toEqual([
      card('Why?!', [paragraph('To grow')]),
      paragraph(),
    ]);
  });

  test('folding from inside the answer moves the caret to the end of the question at once', async () => {
    const body = await renderDoc(
      docOf(card('Why?', [paragraph('To grow')], CARD_ID)),
    );
    await userEvent.click(showAnswer());
    await caretAfter(body, 'To grow');

    toggleTheCard(editorOf(body), 0);

    expect(editorOf(body).state.selection.from).toBe(
      positionOf(body, 'Why?') + 'Why?'.length,
    );
  });

  test('folding a card with a selection that reaches into its answer moves the caret out', async () => {
    const body = await renderDoc(
      docOf(paragraph('Intro'), card('Why?', [paragraph('To grow')], CARD_ID)),
    );
    await userEvent.click(showAnswer());
    const cardPosition = positionOf(body, 'Intro') + 'Intro'.length + 1;
    editorOf(body)
      .chain()
      .focus()
      .setTextSelection({
        from: positionOf(body, 'Intro'),
        to: positionOf(body, 'To grow') + 2,
      })
      .run();

    toggleTheCard(editorOf(body), cardPosition);

    expect(editorOf(body).state.selection.from).toBe(
      positionOf(body, 'Why?') + 'Why?'.length,
    );
  });

  test('⌘⇧Enter in the question opens the card', async () => {
    const body = await renderDoc(
      docOf(card('Why?', [paragraph('To grow')], CARD_ID)),
    );
    await caretAfter(body, 'Why?');

    await userEvent.keyboard(TOGGLE_THE_CARD);

    expect(answerOf(body)).toBeVisible();
  });

  test('opening and closing is not an edit, so ⌘Z skips it', async () => {
    const body = await renderDoc(
      docOf(card('Why?', [paragraph('To grow')], CARD_ID)),
    );
    await caretAfter(body, 'Why?');
    await userEvent.keyboard('!');
    await userEvent.click(showAnswer());

    await userEvent.keyboard(`{${MOD}>}z{/${MOD}}`);

    expect(blocksOf(body)).toEqual([
      card('Why?', [paragraph('To grow')]),
      paragraph(),
    ]);
    expect(answerOf(body)).toBeVisible();
  });
});

describe('the status chip', () => {
  test.each([
    ['new', 'New'],
    ['review', 'Review'],
    ['got_it', 'Got it'],
  ] as const)('shows %s from the statuses', async (status, label) => {
    await renderDoc(docOf(card('Why?', [paragraph('To grow')], CARD_ID)), {
      statuses: { [CARD_ID]: status },
    });

    await expect.element(page.getByText(label, { exact: true })).toBeVisible();
  });

  test('a card the statuses do not know is new', async () => {
    await renderDoc(docOf(card('Why?', [paragraph('To grow')], CARD_ID)), {
      statuses: { [OTHER_CARD_ID]: 'got_it' },
    });

    await expect.element(page.getByText('New', { exact: true })).toBeVisible();
  });
});

describe('copy, cut and paste', () => {
  function clipboard(body: Locator, kind: 'copy' | 'cut') {
    const clipboardData = new DataTransfer();
    body
      .element()
      .dispatchEvent(
        new ClipboardEvent(kind, { clipboardData, bubbles: true }),
      );
    return clipboardData;
  }

  function paste(body: Locator, clipboardData: DataTransfer) {
    body
      .element()
      .dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true }),
      );
  }

  function selectTheCard(body: Locator) {
    editorOf(body).chain().focus().setNodeSelection(0).run();
  }

  test('a card cut and pasted back keeps its id, so it keeps its status', async () => {
    const body = await renderDoc(
      docOf(card('Why?', [paragraph('To grow')], CARD_ID), paragraph('End')),
    );
    selectTheCard(body);
    const cut = clipboard(body, 'cut');
    expect(cardIdsOf(body)).toEqual([]);

    await caretAfter(body, 'End');
    paste(body, cut);

    expect(cardIdsOf(body)).toEqual([CARD_ID]);
  });

  test('a card copied into the same doc gets a new id, the first keeps its own', async () => {
    const body = await renderDoc(
      docOf(card('Why?', [paragraph('To grow')], CARD_ID), paragraph('End')),
    );
    selectTheCard(body);
    const copied = clipboard(body, 'copy');

    await caretAfter(body, 'End');
    paste(body, copied);

    const [first, second] = cardIdsOf(body);
    expect(first).toBe(CARD_ID);
    expect(second).toMatch(/^[\da-f-]{36}$/);
    expect(second).not.toBe(CARD_ID);
  });
});

describe('what goes into a card', () => {
  function slashMenu() {
    return page.getByRole('listbox', { name: 'Blocks' });
  }

  function toolbarButton(name: string) {
    return page
      .getByRole('toolbar', { name: 'Formatting' })
      .getByRole('button', { name, exact: true });
  }

  test('“/” in the answer offers only text, lists and code', async () => {
    const body = await renderDoc(
      docOf(card('Why?', [paragraph('To grow')], CARD_ID)),
    );
    await userEvent.click(showAnswer());
    await caretAfter(body, 'To grow');

    await userEvent.keyboard('{Enter}/');

    await expect.element(slashMenu()).toBeVisible();
    expect(
      slashMenu()
        .getByRole('option')
        .elements()
        .map(({ textContent }) => textContent),
    ).toEqual([
      'Text Just start writing',
      'Bulleted list A simple list',
      'Numbered list A list in order',
      'Checklist Things to tick off',
      'Code A block of code',
    ]);
  });

  test('“/” in the question opens no menu', async () => {
    const body = await renderDoc(
      docOf(card('Why?', [paragraph('To grow')], CARD_ID)),
    );
    await caretAfter(body, 'Why?');

    await userEvent.keyboard(' /');

    await expect.element(slashMenu()).not.toBeInTheDocument();
    await expect
      .element(page.getByText('No matching blocks'))
      .not.toBeInTheDocument();
    expect(blocksOf(body)).toEqual([
      card('Why? /', [paragraph('To grow')]),
      paragraph(),
    ]);
  });

  test('the Card button turns the line with the caret into the question', async () => {
    const body = await renderDoc(docOf(paragraph('¿Qué significa?')));
    await caretAfter(body, 'Qué');

    await userEvent.click(toolbarButton('Card'));
    await userEvent.keyboard(' hablar');

    expect(blocksOf(body)).toEqual([
      card('¿Qué significa? hablar', [paragraph()]),
      paragraph(),
    ]);
  });

  test.each(['Card', 'Divider', 'Heading 1', 'Quote'])(
    'in the answer, %s is off',
    async (name) => {
      const body = await renderDoc(
        docOf(card('Why?', [paragraph('To grow')], CARD_ID)),
      );
      await userEvent.click(showAnswer());
      await caretAfter(body, 'To grow');

      await expect.element(toolbarButton(name)).toBeDisabled();
    },
  );

  test.each(['Card', 'Divider', 'Heading 1', 'Bulleted list', 'Code'])(
    'in the question, %s is off',
    async (name) => {
      const body = await renderDoc(
        docOf(card('Why?', [paragraph('To grow')], CARD_ID)),
      );
      await caretAfter(body, 'Why?');

      await expect.element(toolbarButton(name)).toBeDisabled();
    },
  );

  test('Backspace at the start of the question turns the card back into lines', async () => {
    const body = await renderDoc(
      docOf(card('Why?', [paragraph('To grow')], CARD_ID)),
    );
    editorOf(body).chain().focus().setTextSelection(2).run();
    await expect.element(body).toHaveFocus();

    await userEvent.keyboard('{Backspace}');

    expect(blocksOf(body)).toEqual([
      paragraph('Why?'),
      paragraph('To grow'),
      paragraph(),
    ]);
  });
});
