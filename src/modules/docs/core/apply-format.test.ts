import { type CanCommands, Editor, type JSONContent } from '@tiptap/core';
import { describe, expect, test } from 'vitest';

import { applyFormat, canApplyFormat, isFormatOn } from './apply-format';
import { DocKit } from './doc-kit';
import type { Format } from './formats';

const CARET = '|';

const EVERY_FORMAT: Format[] = [
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
  'card',
  'blockquote',
  'codeBlock',
  'horizontalRule',
];

function text(value: string, mark?: string): JSONContent[] {
  return [
    { type: 'text', text: value, ...(mark && { marks: [{ type: mark }] }) },
  ];
}

function paragraph(value: string, mark?: string): JSONContent {
  return { type: 'paragraph', content: text(value, mark) };
}

function heading(level: number, value: string): JSONContent {
  return { type: 'heading', attrs: { level }, content: text(value) };
}

function bulletList(...items: string[]): JSONContent {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [paragraph(item)],
    })),
  };
}

function orderedList(...items: string[]): JSONContent {
  return {
    type: 'orderedList',
    attrs: { start: 1, type: null },
    content: items.map((item) => ({
      type: 'listItem',
      content: [paragraph(item)],
    })),
  };
}

function checklist(...items: string[]): JSONContent {
  return {
    type: 'taskList',
    content: items.map((item) => ({
      type: 'taskItem',
      attrs: { checked: false },
      content: [paragraph(item)],
    })),
  };
}

function quote(...content: JSONContent[]): JSONContent {
  return { type: 'blockquote', content };
}

function codeBlock(value: string): JSONContent {
  return { type: 'codeBlock', attrs: { language: null }, content: text(value) };
}

const LINE: JSONContent = { type: 'horizontalRule' };

const EMPTY_LINE: JSONContent = { type: 'paragraph' };

function card(question: string, ...answer: JSONContent[]): JSONContent {
  return {
    type: 'details',
    content: [
      { type: 'detailsSummary', content: text(question) },
      { type: 'detailsContent', content: answer },
    ],
  };
}

function editorWith(content: JSONContent[]) {
  const editor = new Editor({
    element: null,
    extensions: [DocKit],
    content: { type: 'doc', content },
  });
  const caret = positionOf(editor, CARET);
  editor
    .chain()
    .deleteRange({ from: caret, to: caret + CARET.length })
    .setTextSelection(caret)
    .run();
  return editor;
}

function positionOf(editor: Editor, wanted: string) {
  let found = -1;
  editor.state.doc.descendants((node, pos) => {
    const index = node.isText ? (node.text ?? '').indexOf(wanted) : -1;
    if (found === -1 && index !== -1) found = pos + index;
  });
  return found;
}

function select(editor: Editor, word: string) {
  const from = positionOf(editor, word);
  editor.commands.setTextSelection({ from, to: from + word.length });
}

function selectFrom(editor: Editor, first: string, last: string) {
  editor.commands.setTextSelection({
    from: positionOf(editor, first),
    to: positionOf(editor, last) + last.length,
  });
}

function type(editor: Editor, value: string) {
  editor.commands.insertContent({ type: 'text', text: value });
}

function blocksOf(editor: Editor) {
  return withoutIds(editor.getJSON()).content;
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

function formatsOn(editor: Editor) {
  return EVERY_FORMAT.filter((format) => isFormatOn(editor, format));
}

function formatsThatDontApply(editor: Editor) {
  return EVERY_FORMAT.filter((format) => !canApplyFormat(editor, format));
}

describe('a block button turns the whole line into its block, and a second press back into text', () => {
  test.each<[Format, JSONContent]>([
    ['heading1', heading(1, 'yo hablo')],
    ['heading2', heading(2, 'yo hablo')],
    ['heading3', heading(3, 'yo hablo')],
    ['bulletList', bulletList('yo hablo')],
    ['orderedList', orderedList('yo hablo')],
    ['taskList', checklist('yo hablo')],
    ['blockquote', quote(paragraph('yo hablo'))],
    ['codeBlock', codeBlock('yo hablo')],
  ])('%s', (format, block) => {
    const editor = editorWith([paragraph(`yo ha${CARET}blo`)]);

    applyFormat(editor, format);
    expect(blocksOf(editor)).toEqual([block]);

    applyFormat(editor, format);
    expect(blocksOf(editor)).toEqual([paragraph('yo hablo')]);
  });

  test('a heading button on a heading of another level changes the level', () => {
    const editor = editorWith([heading(1, `Ha${CARET}blar`)]);

    applyFormat(editor, 'heading2');

    expect(blocksOf(editor)).toEqual([heading(2, 'Hablar')]);
  });

  test('a list button in a list of another kind turns that whole list into its kind, as its shortcut does', () => {
    const editor = editorWith([bulletList(`y${CARET}o`, 'tú')]);

    applyFormat(editor, 'orderedList');

    expect(blocksOf(editor)).toEqual([orderedList('yo', 'tú')]);
  });

  test('a heading button in a list item takes the line out of the list, as its shortcut does', () => {
    const editor = editorWith([bulletList(`y${CARET}o`, 'tú')]);

    applyFormat(editor, 'heading2');

    expect(blocksOf(editor)).toEqual([heading(2, 'yo'), bulletList('tú')]);
  });
});

describe('a mark button marks the selected text, and a second press takes the mark off', () => {
  test.each(['bold', 'italic', 'strike', 'code'] as const)('%s', (mark) => {
    const editor = editorWith([paragraph(`${CARET}yo hablo`)]);
    select(editor, 'hablo');

    applyFormat(editor, mark);
    expect(blocksOf(editor)).toEqual([
      { type: 'paragraph', content: [...text('yo '), ...text('hablo', mark)] },
    ]);

    applyFormat(editor, mark);
    expect(blocksOf(editor)).toEqual([paragraph('yo hablo')]);
  });

  test('with nothing selected, the text typed next takes the mark', () => {
    const editor = editorWith([paragraph(`yo ${CARET}`)]);

    applyFormat(editor, 'bold');
    type(editor, 'hablo');

    expect(blocksOf(editor)).toEqual([
      {
        type: 'paragraph',
        content: [...text('yo '), ...text('hablo', 'bold')],
      },
    ]);
  });
});

describe('the divider goes under the whole line, with a new line under it for the caret', () => {
  test('wherever the caret is in the line', () => {
    const editor = editorWith([paragraph(`yo ha${CARET}blo`), paragraph('tú')]);

    applyFormat(editor, 'horizontalRule');
    type(editor, 'él');

    expect(blocksOf(editor)).toEqual([
      paragraph('yo hablo'),
      LINE,
      paragraph('él'),
      paragraph('tú'),
    ]);
  });

  test('and leaves selected text as it is', () => {
    const editor = editorWith([paragraph(`${CARET}yo hablo`)]);
    select(editor, 'hablo');

    applyFormat(editor, 'horizontalRule');
    type(editor, 'él');

    expect(blocksOf(editor)).toEqual([
      paragraph('yo hablo'),
      LINE,
      paragraph('él'),
    ]);
  });

  test('an empty line becomes the divider', () => {
    const editor = editorWith([paragraph('yo hablo'), paragraph(CARET)]);

    applyFormat(editor, 'horizontalRule');
    type(editor, 'él');

    expect(blocksOf(editor)).toEqual([
      paragraph('yo hablo'),
      LINE,
      paragraph('él'),
    ]);
  });

  test('under a list item it parts the list, as the slash menu does', () => {
    const editor = editorWith([bulletList(`y${CARET}o`, 'tú')]);

    applyFormat(editor, 'horizontalRule');
    type(editor, 'él');

    expect(blocksOf(editor)).toEqual([
      bulletList('yo'),
      LINE,
      paragraph('él'),
      bulletList('tú'),
    ]);
  });

  test('under a line of a quote it parts the quote, as the slash menu does', () => {
    const editor = editorWith([
      quote(paragraph(`Poco a ${CARET}poco`), paragraph('se va lejos')),
    ]);

    applyFormat(editor, 'horizontalRule');
    type(editor, 'él');

    expect(blocksOf(editor)).toEqual([
      quote(paragraph('Poco a poco')),
      LINE,
      paragraph('él'),
      quote(paragraph('se va lejos')),
    ]);
  });

  test('under a code block it goes below the whole block', () => {
    const editor = editorWith([codeBlock(`habl${CARET}ar`)]);

    applyFormat(editor, 'horizontalRule');
    type(editor, 'él');

    expect(blocksOf(editor)).toEqual([
      codeBlock('hablar'),
      LINE,
      paragraph('él'),
    ]);
  });
});

describe('the card button makes a card of the line or of the selected blocks', () => {
  test('the line with the caret becomes the question, the caret at its end', () => {
    const editor = editorWith([paragraph(`¿Qué ${CARET}es?`), paragraph('tú')]);

    applyFormat(editor, 'card');
    type(editor, '!');

    expect(blocksOf(editor)).toEqual([
      card('¿Qué es?!', EMPTY_LINE),
      paragraph('tú'),
    ]);
  });

  test('a piece of text selected in a line makes the whole line the question', () => {
    const editor = editorWith([paragraph(`${CARET}¿Qué significa hablar?`)]);
    select(editor, 'hablar');

    applyFormat(editor, 'card');

    expect(blocksOf(editor)).toEqual([
      card('¿Qué significa hablar?', EMPTY_LINE),
    ]);
  });

  test('an empty line becomes an empty card', () => {
    const editor = editorWith([paragraph('Verbs'), paragraph(CARET)]);

    applyFormat(editor, 'card');
    type(editor, '¿hablar?');

    expect(blocksOf(editor)).toEqual([
      paragraph('Verbs'),
      card('¿hablar?', EMPTY_LINE),
    ]);
  });

  test('of the selected blocks, a heading becomes the question and the rest the answer', () => {
    const editor = editorWith([
      heading(2, `${CARET}Hablar`),
      paragraph('to speak'),
      paragraph('yo hablo'),
      paragraph('after'),
    ]);
    selectFrom(editor, 'Hablar', 'yo hablo');

    applyFormat(editor, 'card');

    expect(blocksOf(editor)).toEqual([
      card('Hablar', paragraph('to speak'), paragraph('yo hablo')),
      paragraph('after'),
    ]);
  });

  test('empty lines at the ends of the selection and of the answer are left out', () => {
    const editor = editorWith([
      paragraph(CARET),
      heading(2, 'Hablar'),
      EMPTY_LINE,
      paragraph('to speak'),
      EMPTY_LINE,
      paragraph('yo hablo'),
      EMPTY_LINE,
    ]);
    editor.commands.selectAll();

    applyFormat(editor, 'card');

    expect(blocksOf(editor)).toEqual([
      card('Hablar', paragraph('to speak'), EMPTY_LINE, paragraph('yo hablo')),
    ]);
  });

  test('a line break in the question line turns into a space', () => {
    const editor = editorWith([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: `${CARET}¿Qué` },
          { type: 'hardBreak' },
          { type: 'text', text: 'es?' },
        ],
      },
      paragraph('Ya'),
    ]);
    selectFrom(editor, '¿Qué', 'Ya');

    applyFormat(editor, 'card');

    expect(blocksOf(editor)).toEqual([card('¿Qué es?', paragraph('Ya'))]);
  });

  test('blocks an answer cannot hold turn into ones it can: a heading into text, a quote into its lines, a divider goes', () => {
    const editor = editorWith([
      paragraph(`${CARET}¿Qué?`),
      heading(3, 'Hablar'),
      quote(paragraph('Poco a poco')),
      LINE,
      bulletList('yo', 'tú'),
    ]);
    selectFrom(editor, '¿Qué?', 'tú');

    applyFormat(editor, 'card');

    expect(blocksOf(editor)).toEqual([
      card(
        '¿Qué?',
        paragraph('Hablar'),
        paragraph('Poco a poco'),
        bulletList('yo', 'tú'),
      ),
    ]);
  });

  test('a selection that starts in a list makes a card with an empty question and the blocks as its answer', () => {
    const editor = editorWith([
      bulletList(`${CARET}yo`, 'tú'),
      paragraph('él'),
    ]);
    selectFrom(editor, 'yo', 'él');

    applyFormat(editor, 'card');

    expect(blocksOf(editor)).toEqual([
      {
        type: 'details',
        content: [
          { type: 'detailsSummary' },
          {
            type: 'detailsContent',
            content: [bulletList('yo', 'tú'), paragraph('él')],
          },
        ],
      },
    ]);
  });

  test('in a list item the card goes under the line and parts the list, as the slash menu does', () => {
    const editor = editorWith([bulletList(`y${CARET}o`, 'tú')]);

    applyFormat(editor, 'card');
    type(editor, '¿hablar?');

    expect(blocksOf(editor)).toEqual([
      bulletList('yo'),
      card('¿hablar?', EMPTY_LINE),
      bulletList('tú'),
    ]);
  });

  test('a selection that ends at the start of a line leaves that line out', () => {
    const editor = editorWith([
      paragraph(`${CARET}¿Qué?`),
      paragraph('Ya'),
      paragraph('después'),
    ]);
    editor.commands.setTextSelection({
      from: positionOf(editor, '¿Qué?'),
      to: positionOf(editor, 'después'),
    });

    applyFormat(editor, 'card');

    expect(blocksOf(editor)).toEqual([
      card('¿Qué?', paragraph('Ya')),
      paragraph('después'),
    ]);
  });

  test('is off for a selected divider, which has nothing to ask', () => {
    const editor = editorWith([paragraph(`y${CARET}o`), LINE, paragraph('tú')]);
    editor.commands.setNodeSelection('yo'.length + 2);

    expect(canApplyFormat(editor, 'card')).toBe(false);
  });

  test('is off for a selection that holds a card', () => {
    const editor = editorWith([
      paragraph(`${CARET}Intro`),
      card('¿Qué?', paragraph('Ya')),
      paragraph('End'),
    ]);
    selectFrom(editor, 'Intro', 'End');

    expect(canApplyFormat(editor, 'card')).toBe(false);
  });
});

describe('what is on where the caret is', () => {
  test.each<[string, JSONContent[], Format[]]>([
    ['plain text', [paragraph(`yo ha${CARET}blo`)], []],
    [
      'a heading 2, and no other level',
      [heading(2, `Ha${CARET}blar`)],
      ['heading2'],
    ],
    ['bold text', [paragraph(`ha${CARET}blo`, 'bold')], ['bold']],
    ['inline code', [paragraph(`ha${CARET}blo`, 'code')], ['code']],
    ['a bulleted list', [bulletList(`y${CARET}o`)], ['bulletList']],
    ['a numbered list', [orderedList(`y${CARET}o`)], ['orderedList']],
    ['a checklist', [checklist(`Re${CARET}ad`)], ['taskList']],
    ['a code block', [codeBlock(`habl${CARET}ar`)], ['codeBlock']],
    [
      'a list inside a quote: both',
      [quote(bulletList(`y${CARET}o`))],
      ['bulletList', 'blockquote'],
    ],
  ])('in %s', (_, content, on) => {
    expect(formatsOn(editorWith(content))).toEqual(on);
  });

  test('the divider is never on, even when it is the selected node', () => {
    const editor = editorWith([paragraph(`y${CARET}o`), LINE, paragraph('tú')]);
    editor.commands.setNodeSelection('yo'.length + 2);

    expect(editor.state.selection.$from.nodeAfter?.type.name).toBe(
      'horizontalRule',
    );
    expect(isFormatOn(editor, 'horizontalRule')).toBe(false);
  });
});

describe('what applies where the caret is', () => {
  test('everything, in plain text', () => {
    expect(formatsThatDontApply(editorWith([paragraph(`y${CARET}o`)]))).toEqual(
      [],
    );
  });

  test('no mark in a code block', () => {
    expect(
      formatsThatDontApply(editorWith([codeBlock(`habl${CARET}ar`)])),
    ).toEqual(['bold', 'italic', 'strike', 'code']);
  });

  test('no other mark in inline code', () => {
    expect(
      formatsThatDontApply(editorWith([paragraph(`ha${CARET}blo`, 'code')])),
    ).toEqual(['bold', 'italic', 'strike']);
  });

  test('only marks in the question of a card', () => {
    expect(
      formatsThatDontApply(
        editorWith([card(`¿Qu${CARET}é?`, paragraph('Ya'))]),
      ),
    ).toEqual([
      'heading1',
      'heading2',
      'heading3',
      'bulletList',
      'orderedList',
      'taskList',
      'card',
      'blockquote',
      'codeBlock',
      'horizontalRule',
    ]);
  });

  test('marks, lists and code in the answer of a card', () => {
    expect(
      formatsThatDontApply(
        editorWith([card('¿Qué?', paragraph(`Y${CARET}a`))]),
      ),
    ).toEqual([
      'heading1',
      'heading2',
      'heading3',
      'card',
      'blockquote',
      'horizontalRule',
    ]);
  });

  test('no quote in a list item, which must start with a paragraph', () => {
    expect(
      formatsThatDontApply(editorWith([bulletList(`y${CARET}o`)])),
    ).toEqual(['blockquote']);
  });

  test.each<[string, JSONContent[], Format, (can: CanCommands) => boolean]>([
    [
      'a heading in a list item',
      [bulletList(`y${CARET}o`)],
      'heading2',
      (can) => can.toggleHeading({ level: 2 }),
    ],
    [
      'a code block in a checklist item',
      [checklist(`Re${CARET}ad`)],
      'codeBlock',
      (can) => can.toggleCodeBlock(),
    ],
    [
      'a list on a heading line',
      [heading(2, `Ha${CARET}blar`)],
      'bulletList',
      (can) => can.toggleBulletList(),
    ],
    [
      'a numbered list in a code block',
      [codeBlock(`habl${CARET}ar`)],
      'orderedList',
      (can) => can.toggleOrderedList(),
    ],
  ])(
    '%s applies, as its shortcut does there, though editor.can() says no',
    (_, content, format, askTiptap) => {
      const editor = editorWith(content);

      expect(askTiptap(editor.can())).toBe(false);
      expect(canApplyFormat(editor, format)).toBe(true);
    },
  );

  test('asking leaves the doc and the caret as they were', () => {
    const editor = editorWith([bulletList(`y${CARET}o`, 'tú')]);
    const before = editor.getJSON();
    const { from } = editor.state.selection;

    for (const format of EVERY_FORMAT) canApplyFormat(editor, format);

    expect(editor.getJSON()).toEqual(before);
    expect(editor.state.selection.from).toBe(from);
  });
});
