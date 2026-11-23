import { Editor, type JSONContent } from '@tiptap/core';
import { describe, expect, onTestFinished, test } from 'vitest';

import { DocKit } from './doc-kit';

async function openedEditor(content: JSONContent | null = null) {
  const created = Promise.withResolvers<Editor>();
  const editor = new Editor({
    element: document.body.appendChild(document.createElement('div')),
    extensions: [DocKit],
    content,
    onCreate: ({ editor: opened }) => {
      created.resolve(opened);
    },
  });
  onTestFinished(() => {
    editor.destroy();
  });
  return created.promise;
}

function coloured(attrs: Record<string, string | null>): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'hablo',
            marks: [
              {
                type: 'textStyle',
                attrs: { color: null, backgroundColor: null, ...attrs },
              },
            ],
          },
        ],
      },
    ],
  };
}

function marksOf(editor: Editor) {
  const line: JSONContent[] = editor.getJSON().content[0]?.content ?? [];
  return line.flatMap(
    ({ text, marks }) => marks?.map(({ attrs }) => ({ text, ...attrs })) ?? [],
  );
}

describe('coloured text on the page', () => {
  test('is a span with the names of its colours and their classes, never an inline style', async () => {
    const editor = await openedEditor(
      coloured({ color: 'red', backgroundColor: 'yellow' }),
    );
    const span = editor.view.dom.querySelector('span');

    expect(span?.dataset).toMatchObject({ color: 'red', bg: 'yellow' });
    expect([...(span?.classList ?? [])].sort()).toEqual([
      'bg-marker-yellow',
      'text-ink-red',
    ]);
    expect(span?.hasAttribute('style')).toBe(false);
  });

  test('with a text colour only has no background', async () => {
    const editor = await openedEditor(coloured({ color: 'blue' }));
    const span = editor.view.dom.querySelector('span');

    expect(span?.dataset.bg).toBeUndefined();
    expect(span?.className).toBe('text-ink-blue');
  });
});

describe('pasted text', () => {
  test('from another Kotsu doc keeps its colours', async () => {
    const editor = await openedEditor();

    editor.view.pasteHTML(
      '<p><span data-color="green" data-bg="pink" class="text-ink-green bg-marker-pink">hola</span></p>',
    );

    expect(marksOf(editor)).toEqual([
      { text: 'hola', color: 'green', backgroundColor: 'pink' },
    ]);
  });

  test.each([
    [
      'a colour in an inline style, as Google Docs writes it',
      '<p><span style="color: #ff0000; background-color: rgb(255, 255, 0)">hola</span></p>',
    ],
    [
      'a name outside the palette',
      '<p><span data-color="teal">hola</span></p>',
    ],
    ['a name in another case', '<p><span data-bg="Yellow">hola</span></p>'],
    [
      'a font from a website',
      '<p><span style="font-size: 40px">hola</span></p>',
    ],
  ])('with %s comes in as plain text', async (_, html) => {
    const editor = await openedEditor();

    editor.view.pasteHTML(html);

    expect(editor.getJSON().content[0]?.content).toEqual([
      { type: 'text', text: 'hola' },
    ]);
  });

  test('keeps the one of its two names that is ours', async () => {
    const editor = await openedEditor();

    editor.view.pasteHTML(
      '<p><span data-color="teal" data-bg="yellow">hola</span></p>',
    );

    expect(marksOf(editor)).toEqual([
      { text: 'hola', color: null, backgroundColor: 'yellow' },
    ]);
  });

  test('takes our name and leaves an inline style beside it', async () => {
    const editor = await openedEditor();

    editor.view.pasteHTML(
      '<p><span data-color="purple" style="color: #0000ff; background-color: #ff0">hola</span></p>',
    );

    expect(marksOf(editor)).toEqual([
      { text: 'hola', color: 'purple', backgroundColor: null },
    ]);
  });
});
