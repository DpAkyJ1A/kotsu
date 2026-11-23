import { Editor, type JSONContent } from '@tiptap/core';
import { describe, expect, test } from 'vitest';

import {
  canColour,
  type Colouring,
  coloursAt,
  colourText,
} from './apply-colour';
import { DocKit } from './doc-kit';

type Colours = { color?: string; backgroundColor?: string };

function coloured(value: string, { color, backgroundColor }: Colours) {
  return {
    type: 'text',
    text: value,
    marks: [
      {
        type: 'textStyle',
        attrs: {
          color: color ?? null,
          backgroundColor: backgroundColor ?? null,
        },
      },
    ],
  };
}

function plain(value: string): JSONContent {
  return { type: 'text', text: value };
}

function editorWith(...content: JSONContent[]) {
  return new Editor({
    element: null,
    extensions: [DocKit],
    content: { type: 'doc', content: [{ type: 'paragraph', content }] },
  });
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

function colour(editor: Editor, colouring: Colouring) {
  return editor.commands.command(({ commands }) =>
    colourText(commands, colouring),
  );
}

function lineOf(editor: Editor) {
  return editor.getJSON().content[0]?.content;
}

describe('colourText', () => {
  test('colours the selected text', () => {
    const editor = editorWith(plain('yo hablo'));
    select(editor, 'hablo');

    colour(editor, { text: 'blue' });

    expect(lineOf(editor)).toEqual([
      plain('yo '),
      coloured('hablo', { color: 'blue' }),
    ]);
  });

  test('puts a background under the selected text', () => {
    const editor = editorWith(plain('yo hablo'));
    select(editor, 'hablo');

    colour(editor, { background: 'yellow' });

    expect(lineOf(editor)).toEqual([
      plain('yo '),
      coloured('hablo', { backgroundColor: 'yellow' }),
    ]);
  });

  test('gives both at once, in one mark', () => {
    const editor = editorWith(plain('hablo'));
    select(editor, 'hablo');

    colour(editor, { text: 'red', background: 'yellow' });

    expect(lineOf(editor)).toEqual([
      coloured('hablo', { color: 'red', backgroundColor: 'yellow' }),
    ]);
  });

  test('a background put on coloured text keeps its colour', () => {
    const editor = editorWith(coloured('hablo', { color: 'blue' }));
    select(editor, 'hablo');

    colour(editor, { background: 'yellow' });

    expect(lineOf(editor)).toEqual([
      coloured('hablo', { color: 'blue', backgroundColor: 'yellow' }),
    ]);
  });

  test('a new colour replaces the old one', () => {
    const editor = editorWith(coloured('hablo', { color: 'blue' }));
    select(editor, 'hablo');

    colour(editor, { text: 'pink' });

    expect(lineOf(editor)).toEqual([coloured('hablo', { color: 'pink' })]);
  });

  test('Default for the text takes the colour off and leaves the background', () => {
    const editor = editorWith(
      coloured('hablo', { color: 'blue', backgroundColor: 'yellow' }),
    );
    select(editor, 'hablo');

    colour(editor, { text: null });

    expect(lineOf(editor)).toEqual([
      coloured('hablo', { backgroundColor: 'yellow' }),
    ]);
  });

  test('Default for the only colour on the text takes the whole mark off', () => {
    const editor = editorWith(coloured('hablo', { backgroundColor: 'yellow' }));
    select(editor, 'hablo');

    colour(editor, { background: null });

    expect(lineOf(editor)).toEqual([plain('hablo')]);
  });

  test('a colour left out is left alone', () => {
    const editor = editorWith(
      coloured('hablo', { color: 'blue', backgroundColor: 'yellow' }),
    );
    select(editor, 'hablo');

    colour(editor, { background: 'green' });

    expect(lineOf(editor)).toEqual([
      coloured('hablo', { color: 'blue', backgroundColor: 'green' }),
    ]);
  });

  test('at a caret, colours what is typed next', () => {
    const editor = editorWith(plain('yo '));
    editor.commands.setTextSelection(positionOf(editor, ' ') + 1);

    colour(editor, { text: 'green' });
    editor.commands.command(({ tr }) => {
      tr.insertText('hablo');
      return true;
    });

    expect(lineOf(editor)).toEqual([
      plain('yo '),
      coloured('hablo', { color: 'green' }),
    ]);
  });
});

describe('coloursAt', () => {
  test('says the colour and the background where the caret is', () => {
    const editor = editorWith(
      plain('yo '),
      coloured('hablo', { color: 'blue', backgroundColor: 'yellow' }),
    );

    editor.commands.setTextSelection(positionOf(editor, 'hablo') + 2);
    expect(coloursAt(editor)).toEqual({ text: 'blue', background: 'yellow' });

    editor.commands.setTextSelection(positionOf(editor, 'yo') + 1);
    expect(coloursAt(editor)).toEqual({ text: null, background: null });
  });
});

describe('canColour', () => {
  test('is true in text and false in a code block, which holds no marks', () => {
    const editor = new Editor({
      element: null,
      extensions: [DocKit],
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [plain('hablo')] },
          { type: 'codeBlock', content: [plain('yo hablo')] },
        ],
      },
    });

    select(editor, 'hablo');
    expect(canColour(editor)).toBe(true);

    select(editor, 'yo hablo');
    expect(canColour(editor)).toBe(false);
  });

  test('is false in inline code, which takes no other mark', () => {
    const editor = editorWith({
      type: 'text',
      text: 'hablo',
      marks: [{ type: 'code' }],
    });
    select(editor, 'hablo');

    expect(canColour(editor)).toBe(false);
  });

  test('leaves the doc as it was', () => {
    const editor = editorWith(plain('hablo'));
    select(editor, 'hablo');

    canColour(editor);

    expect(lineOf(editor)).toEqual([plain('hablo')]);
  });
});
