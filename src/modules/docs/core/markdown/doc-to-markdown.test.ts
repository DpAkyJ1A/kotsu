import { describe, expect, test } from 'vitest';

import { docToMarkdown } from './doc-to-markdown';
import {
  BOLD,
  card,
  CODE,
  codeBlock,
  colour,
  docOf,
  HARD_BREAK,
  heading,
  ITALIC,
  listOf,
  paragraph,
  STRIKE,
  text,
} from './testing';

describe('docToMarkdown', () => {
  test('writes a doc as plain Markdown, with HTML only where Markdown has no way to say it', () => {
    const doc = docOf(
      heading(1, 'Ser and estar'),
      paragraph(
        text('Ser', BOLD),
        ' is what something ',
        text('is', ITALIC),
        ', ',
        text('estar', colour('blue', null)),
        ' how it ',
        text('is now ', BOLD),
        'today.',
      ),
      paragraph(),
      paragraph(
        '1. Not a list, ',
        text('soy', CODE),
        HARD_BREAK,
        'eres ~~no~~',
      ),
      listOf(
        'bulletList',
        [paragraph('yo soy')],
        [paragraph('tú eres'), listOf('bulletList', [paragraph('informal')])],
      ),
      listOf('bulletList', [paragraph('another list')]),
      {
        type: 'orderedList',
        attrs: { start: 3 },
        content: [{ type: 'listItem', content: [paragraph('tres')] }],
      },
      {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: true },
            content: [paragraph('learn ser')],
          },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [paragraph()],
          },
        ],
      },
      listOf('bulletList', [
        paragraph(),
        listOf('bulletList', [paragraph('under an empty line')]),
      ]),
      {
        type: 'blockquote',
        content: [paragraph('Poco a poco'), paragraph('se va lejos.')],
      },
      codeBlock('const verb = "ser";', 'ts'),
      { type: 'horizontalRule' },
      card(
        [text('¿Qué significa '), text('hablar', ITALIC), text('?')],
        paragraph('to speak'),
        listOf('bulletList', [paragraph('hablo')]),
      ),
      paragraph(
        text('gone ', STRIKE),
        text('red on yellow', colour('red', 'yellow'), BOLD),
      ),
    );

    expect(docToMarkdown(doc)).toBe(
      [
        '# Ser and estar',
        '',
        '**Ser** is what something _is_, <span data-color="blue">estar</span> how it <strong>is now </strong>today.',
        '',
        '',
        '1\\. Not a list, `soy`<br>eres \\~\\~no\\~\\~',
        '',
        '- yo soy',
        '- tú eres',
        '',
        '  - informal',
        '',
        '* another list',
        '',
        '3. tres',
        '',
        '- [x] learn ser',
        '- [ ]',
        '',
        '* <!-- -->',
        '',
        '  - under an empty line',
        '',
        '> Poco a poco',
        '>',
        '> se va lejos.',
        '',
        '```ts',
        'const verb = "ser";',
        '```',
        '',
        '---',
        '',
        '<details>',
        '<summary>¿Qué significa _hablar_?</summary>',
        '',
        'to speak',
        '',
        '- hablo',
        '',
        '</details>',
        '',
        '<s>gone </s><span data-color="red" data-bg="yellow">**red on yellow**</span>',
        '',
      ].join('\n'),
    );
  });

  test('an empty doc is an empty string', () => {
    expect(docToMarkdown(docOf(paragraph()))).toBe('');
  });

  test('empty lines at the start and end of a doc are left out', () => {
    expect(docToMarkdown(docOf(paragraph(), paragraph('a'), paragraph()))).toBe(
      'a\n',
    );
  });

  test('a code fence is longer than any run of backticks in the code', () => {
    expect(docToMarkdown(docOf(codeBlock('```\n````')))).toBe(
      '`````\n```\n````\n`````\n',
    );
  });

  test('a code span is longer than any run of backticks in it, and padded when it starts or ends with one', () => {
    expect(docToMarkdown(docOf(paragraph(text('a `b`', CODE))))).toBe(
      '`` a `b` ``\n',
    );
  });

  test('spaces at the edges of a line are written as entities, so Markdown keeps them', () => {
    expect(docToMarkdown(docOf(paragraph('    indented ')))).toBe(
      '&#32;   indented&#32;\n',
    );
  });

  test('a heading that ends in # keeps it', () => {
    expect(docToMarkdown(docOf(heading(2, 'Verbs #')))).toBe('## Verbs \\#\n');
  });
});
