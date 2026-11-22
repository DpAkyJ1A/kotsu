import { Editor, type JSONContent } from '@tiptap/core';
import { describe, expect, test } from 'vitest';

import { DocKit } from './doc-kit';
import { insertBlock } from './insert-block';
import type { SlashBlock } from './slash-blocks';

const QUERY = /\/\w*/;

function text(value: string): JSONContent[] {
  return value ? [{ type: 'text', text: value }] : [];
}

function paragraph(value = ''): JSONContent {
  return { type: 'paragraph', content: text(value) };
}

function heading(level: number, value = ''): JSONContent {
  return { type: 'heading', attrs: { level }, content: text(value) };
}

function bulletList(...items: JSONContent[][]): JSONContent {
  return {
    type: 'bulletList',
    content: items.map((content) => ({ type: 'listItem', content })),
  };
}

function orderedList(...items: JSONContent[][]): JSONContent {
  return {
    type: 'orderedList',
    attrs: { start: 1, type: null },
    content: items.map((content) => ({ type: 'listItem', content })),
  };
}

function checklist(...items: [boolean, string][]): JSONContent {
  return {
    type: 'taskList',
    content: items.map(([checked, line]) => ({
      type: 'taskItem',
      attrs: { checked },
      content: [paragraph(line)],
    })),
  };
}

function quote(...content: JSONContent[]): JSONContent {
  return { type: 'blockquote', content };
}

function codeBlock(value = ''): JSONContent {
  return { type: 'codeBlock', attrs: { language: null }, content: text(value) };
}

const LINE: JSONContent = { type: 'horizontalRule' };

function editorWith(content: JSONContent[]) {
  return new Editor({
    element: null,
    extensions: [DocKit],
    content: { type: 'doc', content },
  });
}

function rangeOfQuery(editor: Editor) {
  let range = { from: 0, to: 0 };
  editor.state.doc.descendants((node, pos) => {
    const match = node.isText ? QUERY.exec(node.text ?? '') : null;
    if (match) {
      const from = pos + match.index;
      range = { from, to: from + match[0].length };
    }
  });
  return range;
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

function pickAndType(content: JSONContent[], block: SlashBlock) {
  const editor = editorWith(content);
  const range = rangeOfQuery(editor);
  editor.commands.setTextSelection(range.to);
  insertBlock(editor, range, block);
  type(editor, 'hablo');
  return blocksOf(editor);
}

describe('on a line that holds only the query, the line becomes the block', () => {
  test.each<[SlashBlock, JSONContent[]]>([
    ['text', [paragraph('hablo')]],
    ['heading1', [heading(1, 'hablo')]],
    ['heading2', [heading(2, 'hablo')]],
    ['heading3', [heading(3, 'hablo')]],
    ['bulletList', [bulletList([paragraph('hablo')])]],
    ['orderedList', [orderedList([paragraph('hablo')])]],
    ['taskList', [checklist([false, 'hablo'])]],
    ['blockquote', [quote(paragraph('hablo'))]],
    ['codeBlock', [codeBlock('hablo')]],
    ['horizontalRule', [LINE, paragraph('hablo')]],
  ])('%s', (block, expected) => {
    expect(pickAndType([paragraph('/q')], block)).toEqual(expected);
  });

  test('a heading of another level takes the new level', () => {
    expect(pickAndType([heading(1, '/q')], 'heading2')).toEqual([
      heading(2, 'hablo'),
    ]);
  });

  test('a quote made from a heading line holds a paragraph, not the heading', () => {
    expect(pickAndType([heading(2, '/q')], 'blockquote')).toEqual([
      quote(paragraph('hablo')),
    ]);
  });
});

describe('on a line with text, the block goes below it and takes the caret', () => {
  test.each<[SlashBlock, JSONContent]>([
    ['text', paragraph('hablo')],
    ['heading1', heading(1, 'hablo')],
    ['heading2', heading(2, 'hablo')],
    ['heading3', heading(3, 'hablo')],
    ['bulletList', bulletList([paragraph('hablo')])],
    ['orderedList', orderedList([paragraph('hablo')])],
    ['taskList', checklist([false, 'hablo'])],
    ['blockquote', quote(paragraph('hablo'))],
    ['codeBlock', codeBlock('hablo')],
  ])('%s', (block, below) => {
    expect(pickAndType([paragraph('Verbs /q')], block)).toEqual([
      paragraph('Verbs '),
      below,
    ]);
  });

  test('a divider gets a new paragraph under it for the caret, even with a block below', () => {
    expect(
      pickAndType(
        [paragraph('Verbs /q'), bulletList([paragraph('yo')])],
        'horizontalRule',
      ),
    ).toEqual([
      paragraph('Verbs '),
      LINE,
      paragraph('hablo'),
      bulletList([paragraph('yo')]),
    ]);
  });

  test('text after the query stays on its line, and the block goes below the whole line', () => {
    expect(pickAndType([paragraph('Verbs /q to learn')], 'heading2')).toEqual([
      paragraph('Verbs  to learn'),
      heading(2, 'hablo'),
    ]);
  });

  test('a heading line gets a plain paragraph below it for text', () => {
    expect(pickAndType([heading(2, 'Verbs /q')], 'text')).toEqual([
      heading(2, 'Verbs '),
      paragraph('hablo'),
    ]);
  });
});

describe('in lists', () => {
  test('the list a line is in gets a new item below it', () => {
    expect(
      pickAndType([bulletList([paragraph('yo /q')])], 'bulletList'),
    ).toEqual([bulletList([paragraph('yo ')], [paragraph('hablo')])]);
  });

  test('a checklist item added below a ticked one starts unticked', () => {
    expect(pickAndType([checklist([true, 'Read /q'])], 'taskList')).toEqual([
      checklist([true, 'Read '], [false, 'hablo']),
    ]);
  });

  test('another block goes between the two halves of the list', () => {
    expect(
      pickAndType(
        [bulletList([paragraph('yo /q')], [paragraph('tú')])],
        'heading2',
      ),
    ).toEqual([
      bulletList([paragraph('yo ')]),
      heading(2, 'hablo'),
      bulletList([paragraph('tú')]),
    ]);
  });

  test('an empty item turned into the list it is in stays where it is, nested too', () => {
    expect(
      pickAndType(
        [bulletList([paragraph('yo'), bulletList([paragraph('/q')])])],
        'bulletList',
      ),
    ).toEqual([
      bulletList([paragraph('yo'), bulletList([paragraph('hablo')])]),
    ]);
  });

  test('an empty item turned into another list leaves its list, which goes on below', () => {
    expect(
      pickAndType(
        [bulletList([paragraph('yo')], [paragraph('/q')], [paragraph('tú')])],
        'orderedList',
      ),
    ).toEqual([
      bulletList([paragraph('yo')]),
      orderedList([paragraph('hablo')]),
      bulletList([paragraph('tú')]),
    ]);
  });

  test('text takes an empty checklist item out of the checklist', () => {
    expect(
      pickAndType([checklist([true, 'Read'], [false, '/q'])], 'text'),
    ).toEqual([checklist([true, 'Read']), paragraph('hablo')]);
  });

  test('a block chosen in the last item of a nested list leaves every list', () => {
    expect(
      pickAndType(
        [
          bulletList([
            paragraph('yo'),
            bulletList([paragraph('tú')], [paragraph('/q')]),
          ]),
        ],
        'heading2',
      ),
    ).toEqual([
      bulletList([paragraph('yo'), bulletList([paragraph('tú')])]),
      heading(2, 'hablo'),
    ]);
  });

  test('a list chosen in the middle of a nested list leaves the lists around it as they were', () => {
    expect(
      pickAndType(
        [
          bulletList([
            paragraph('yo'),
            bulletList([paragraph('tú')], [paragraph('/q')], [paragraph('él')]),
          ]),
        ],
        'taskList',
      ),
    ).toEqual([
      bulletList([
        paragraph('yo'),
        bulletList([paragraph('tú')]),
        checklist([false, 'hablo']),
        bulletList([paragraph('él')]),
      ]),
    ]);
  });

  test('a list started under a list of its kind joins it, as "- " does', () => {
    expect(
      pickAndType(
        [bulletList([paragraph('yo')]), paragraph('/q')],
        'bulletList',
      ),
    ).toEqual([bulletList([paragraph('yo')], [paragraph('hablo')])]);
  });

  test('a list started under a list of another kind stays apart', () => {
    expect(
      pickAndType(
        [bulletList([paragraph('yo')]), paragraph('/q')],
        'orderedList',
      ),
    ).toEqual([
      bulletList([paragraph('yo')]),
      orderedList([paragraph('hablo')]),
    ]);
  });
});

describe('in quotes', () => {
  test('a quote line with text gets a new line in the same quote', () => {
    expect(
      pickAndType([quote(paragraph('Poco a poco /q'))], 'blockquote'),
    ).toEqual([quote(paragraph('Poco a poco '), paragraph('hablo'))]);
  });

  test('another block goes between the two halves of the quote', () => {
    expect(
      pickAndType(
        [quote(paragraph('Poco /q'), paragraph('a poco'))],
        'heading2',
      ),
    ).toEqual([
      quote(paragraph('Poco ')),
      heading(2, 'hablo'),
      quote(paragraph('a poco')),
    ]);
  });
});
