import type { JSONContent } from '@tiptap/core';
import { describe, expect, test } from 'vitest';

import { markdownToDoc } from './markdown-to-doc';
import {
  BOLD,
  card,
  codeBlock,
  colour,
  docOf,
  heading,
  ITALIC,
  listOf,
  paragraph,
  stored,
  STRIKE,
  text,
} from './testing';

function idNumber(count: number) {
  return `00000000-0000-4000-8000-${String(count).padStart(12, '0')}`;
}

function read(markdown: string) {
  let count = 0;
  return markdownToDoc(markdown, { newId: () => idNumber((count += 1)) });
}

function readsAs(markdown: string, doc: JSONContent) {
  expect(stored(read(markdown))).toEqual(stored(doc));
}

describe('markdownToDoc', () => {
  test('gives every block that holds an id a fresh one', () => {
    const doc = read(
      '# Verbs\n\n- ser\n\n<details>\n<summary>q</summary>\n\na\n\n</details>\n',
    );
    const ids: unknown[] = [];
    JSON.stringify(doc, (key, value: unknown) => {
      if (key === 'blockId') ids.push(value);
      return value;
    });
    expect(ids.toSorted()).toEqual([1, 2, 3, 4, 5].map(idNumber));
  });

  test('an empty text is a doc with one empty line', () => {
    readsAs('', docOf(paragraph()));
  });

  test('reads the Markdown other tools write: setext headings, * and + bullets, 1) numbers, indented code', () => {
    readsAs(
      'Verbs\n=====\n\n    yo soy\n\n* ser\n+ estar\n\n1) uno\n',
      docOf(
        heading(1, 'Verbs'),
        codeBlock('yo soy'),
        listOf('bulletList', [paragraph('ser')]),
        listOf('bulletList', [paragraph('estar')]),
        listOf('orderedList', [paragraph('uno')]),
      ),
    );
  });

  test('an empty fenced code block is a code block with no text', () => {
    readsAs('```\n\n```\n', docOf(codeBlock('')));
  });

  test('more than one blank line between blocks gives that many empty lines', () => {
    readsAs(
      'a\n\n\n\nb\n',
      docOf(paragraph('a'), paragraph(), paragraph(), paragraph('b')),
    );
  });

  test('takes strong, b, em, i, s, del and strike tags as marks', () => {
    readsAs(
      '<strong>a</strong><b>b</b><em>c</em><i>d</i><s>e</s><del>f</del><strike>g</strike>',
      docOf(
        paragraph(text('ab', BOLD), text('cd', ITALIC), text('efg', STRIKE)),
      ),
    );
  });

  test('takes a colour only from the palette', () => {
    readsAs(
      '<span data-color="blue" data-bg="hotpink">a</span> <span style="color: red">b</span>',
      docOf(
        paragraph(
          text('a', colour('blue', null)),
          ' <span style="color: red">b</span>',
        ),
      ),
    );
  });

  test('keeps the words of what a doc can’t hold: deep headings, links, pictures, tables, other HTML', () => {
    readsAs(
      [
        '#### Deep',
        '',
        'See [the guide](https://example.com/guide), <https://kotsu.app> and ![a cat](cat.png).',
        '',
        '| verb | yo |',
        '|---|---|',
        '| ser | soy |',
        '',
        '<div>raw</div>',
        '',
      ].join('\n'),
      docOf(
        heading(3, 'Deep'),
        paragraph(
          'See the guide (https://example.com/guide), https://kotsu.app and a cat.',
        ),
        paragraph('verb | yo'),
        paragraph('ser | soy'),
        paragraph('<div>raw</div>'),
      ),
    );
  });

  test('an empty checklist line is a checklist item', () => {
    readsAs(
      '- [ ]\n- [x] done\n- plain\n',
      docOf({
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [paragraph()],
          },
          {
            type: 'taskItem',
            attrs: { checked: true },
            content: [paragraph('done')],
          },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [paragraph('plain')],
          },
        ],
      }),
    );
  });

  test('a card written on one line', () => {
    readsAs(
      '<details><summary>¿ser?</summary>to be</details>\n\nafter\n',
      docOf(card([text('¿ser?')], paragraph('to be')), paragraph('after')),
    );
  });

  test('a card with no summary has an empty question', () => {
    readsAs(
      '<details>\n\nto be\n\n</details>\n',
      docOf(card([], paragraph('to be'))),
    );
  });

  test('an answer keeps only what an answer can hold: a heading becomes a line, a quote its lines, a divider goes, a card inside its question and answer', () => {
    readsAs(
      [
        '<details>',
        '<summary>q</summary>',
        '',
        '## heading',
        '',
        '> quoted',
        '',
        '---',
        '',
        '<details>',
        '<summary>inner</summary>',
        '',
        'inner answer',
        '',
        '</details>',
        '',
        '</details>',
        '',
      ].join('\n'),
      docOf(
        card(
          [text('q')],
          paragraph('heading'),
          paragraph('quoted'),
          paragraph('inner'),
          paragraph('inner answer'),
        ),
      ),
    );
  });

  test('a card that is never closed runs to the end', () => {
    readsAs(
      '<details>\n<summary>q</summary>\n\na\n\nb\n',
      docOf(card([text('q')], paragraph('a'), paragraph('b'))),
    );
  });
});
