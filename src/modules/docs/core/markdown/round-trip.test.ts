import { randomUUID } from 'node:crypto';

import { fc, test as propertyTest } from '@fast-check/vitest';
import type { JSONContent } from '@tiptap/core';
import { describe, expect, test } from 'vitest';

import { COLOURS } from '../colours';
import { docToMarkdown } from './doc-to-markdown';
import { markdownToDoc } from './markdown-to-doc';
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
  stored,
  STRIKE,
  text,
} from './testing';

function roundTrip(doc: JSONContent) {
  return markdownToDoc(docToMarkdown(doc), { newId: randomUUID });
}

const SAMPLES: [string, JSONContent][] = [
  [
    'headings and paragraphs',
    docOf(heading(1, 'Verbs'), heading(3, 'Ser'), paragraph('Yo soy.')),
  ],
  [
    'every mark and both colours',
    docOf(
      paragraph(
        text('ser', BOLD),
        ' and ',
        text('estar', ITALIC),
        ', not ',
        text('tener', STRIKE),
        ' or ',
        text('haber', CODE),
        ' — ',
        text('masculine', colour('blue', null)),
        ' ',
        text('verb', colour(null, 'yellow'), BOLD),
        text(' both', colour('red', 'green')),
      ),
    ),
  ],
  [
    'marks that overlap',
    docOf(
      paragraph(
        text('a', BOLD),
        text('b', BOLD, ITALIC),
        text('c', ITALIC),
        text('d', ITALIC, STRIKE),
      ),
    ),
  ],
  [
    'marks Markdown would read differently are written as tags',
    docOf(
      paragraph(
        text('a', BOLD, ITALIC),
        text('b', STRIKE),
        ' ',
        text('ends in a space ', BOLD),
        'x',
      ),
    ),
  ],
  [
    'Markdown characters as plain text',
    docOf(
      paragraph('# not a heading, *not* _emphasis_, `not code`, ~~no~~'),
      paragraph('- not a list'),
      paragraph('1. not a list either'),
      paragraph('> not a quote'),
      paragraph('<b>not html</b> & &amp; [not](a link) \\ back'),
      paragraph('+ plus'),
      paragraph('---'),
    ),
  ],
  [
    'spaces at the edges of a line, next to characters HTML escapes',
    docOf(
      paragraph('    four spaces'),
      paragraph(' "Q&A" <3 it\'s '),
      paragraph('trailing  '),
      paragraph(' '),
    ),
  ],
  [
    'a link-looking address stays text',
    docOf(paragraph('see https://example.com/a_b*c~d and www.kotsu.app.')),
  ],
  [
    'line breaks',
    docOf(
      paragraph('one', HARD_BREAK, 'two'),
      paragraph(HARD_BREAK),
      paragraph('end', HARD_BREAK),
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [text('a'), HARD_BREAK, text('b')],
      },
    ),
  ],
  [
    'empty lines between blocks',
    docOf(paragraph('a'), paragraph(), paragraph(), paragraph('b')),
  ],
  [
    'lists, nested and numbered',
    docOf(
      listOf(
        'bulletList',
        [paragraph('one'), listOf('bulletList', [paragraph('one and a half')])],
        [paragraph('two')],
      ),
      {
        type: 'orderedList',
        attrs: { start: 9 },
        content: [
          { type: 'listItem', content: [paragraph('nine')] },
          {
            type: 'listItem',
            content: [paragraph('ten'), paragraph('still ten')],
          },
        ],
      },
    ),
  ],
  [
    'a checklist, nested',
    docOf({
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [
            paragraph('learn ser'),
            {
              type: 'taskList',
              content: [
                {
                  type: 'taskItem',
                  attrs: { checked: false },
                  content: [paragraph('soy, eres')],
                },
              ],
            },
          ],
        },
      ],
    }),
  ],
  [
    'lists of the same kind one after another stay apart',
    docOf(
      listOf('bulletList', [paragraph('a')]),
      listOf('bulletList', [paragraph('b')]),
      listOf('taskList', [paragraph('c')]),
      paragraph(),
      listOf('orderedList', [paragraph('d')]),
      listOf('orderedList', [paragraph('e')]),
    ),
  ],
  [
    'an empty line inside a list item',
    docOf(
      listOf(
        'bulletList',
        [paragraph('right after the first line'), paragraph(), paragraph('b')],
        [paragraph('a'), paragraph('b'), paragraph(), paragraph('c')],
        [paragraph('d')],
      ),
    ),
  ],
  [
    'a list item that starts with an empty line',
    docOf(
      listOf('bulletList', [
        paragraph(),
        listOf('bulletList', [paragraph('a')]),
      ]),
      listOf('taskList', [paragraph(), listOf('taskList', [paragraph('b')])]),
      listOf('bulletList', [paragraph()]),
    ),
  ],
  [
    'quotes, with a list and an empty line inside',
    docOf({
      type: 'blockquote',
      content: [
        paragraph('Poco a poco.'),
        paragraph(),
        paragraph('se va lejos'),
        listOf('bulletList', [paragraph('one')]),
      ],
    }),
  ],
  [
    'code blocks with fences, languages and blank lines inside',
    docOf(
      codeBlock('const a = 1;\n\n```\nnot the end\n````', 'ts'),
      codeBlock(''),
      codeBlock('x', '`odd'),
      codeBlock('  indented\ttab\n'),
      listOf('bulletList', [paragraph('in a list'), codeBlock('x\n\ny')]),
    ),
  ],
  [
    'a divider',
    docOf(paragraph('a'), { type: 'horizontalRule' }, paragraph('b')),
  ],
  [
    'cards',
    docOf(
      card(
        [text('¿Qué significa '), text('hablar', ITALIC), text('?')],
        paragraph('to speak'),
        listOf('bulletList', [paragraph('hablo')]),
        codeBlock('yo hablo'),
      ),
      card([], paragraph()),
      card([text('<summary> & </details>')], paragraph('</details>')),
      card([text('a</summary> b</details>')], paragraph('c')),
      listOf('bulletList', [
        paragraph('in a list'),
        card([text('q')], paragraph('a')),
      ]),
      { type: 'blockquote', content: [card([text('q')], paragraph('a'))] },
    ),
  ],
];

describe('a doc survives Markdown and back', () => {
  test.each(SAMPLES)('%s', (_, doc) => {
    expect(stored(roundTrip(doc))).toEqual(stored(doc));
  });
});

const TRICKY_CHARACTERS = Array.from('aZ9 \t*_~`\\#<>&[]()-+.!|:/"\';=@$©é日');

const word = fc.string({
  unit: fc.constantFrom(...TRICKY_CHARACTERS),
  minLength: 1,
  maxLength: 5,
});

const colourName = fc.option(fc.constantFrom(...COLOURS), { nil: null });

const colourMark = fc
  .tuple(colourName, colourName)
  .filter(([color, background]) => color !== null || background !== null)
  .map(([color, background]) => colour(color, background));

const wrappingMarks = fc
  .tuple(
    fc.subarray([BOLD, ITALIC, STRIKE]),
    fc.option(colourMark, { nil: null }),
  )
  .map(([marks, colourMarks]) =>
    colourMarks ? [colourMarks, ...marks] : marks,
  );

const styledText = fc.oneof(
  fc.tuple(word, wrappingMarks).map(([value, marks]) => text(value, ...marks)),
  word.map((value) => text(value, CODE)),
);

const line = fc.array(styledText, { minLength: 1, maxLength: 6 });

const lineWithBreaks = fc.array(
  fc.oneof(
    { weight: 5, arbitrary: styledText },
    { weight: 1, arbitrary: fc.constant(HARD_BREAK) },
  ),
  { minLength: 1, maxLength: 6 },
);

describe('any text survives Markdown and back', () => {
  propertyTest.prop([lineWithBreaks])('in a paragraph', (content) => {
    const doc = docOf(paragraph(...content));
    expect(stored(roundTrip(doc))).toEqual(stored(doc));
  });

  propertyTest.prop([lineWithBreaks, fc.constantFrom(1, 2, 3)])(
    'in a heading',
    (content, level) => {
      const doc = docOf({ type: 'heading', attrs: { level }, content });
      expect(stored(roundTrip(doc))).toEqual(stored(doc));
    },
  );

  propertyTest.prop([line, lineWithBreaks])('in a card', (question, answer) => {
    const doc = docOf(card(question, paragraph(...answer)));
    expect(stored(roundTrip(doc))).toEqual(stored(doc));
  });

  propertyTest.prop([lineWithBreaks])('in a list item', (content) => {
    const doc = docOf(listOf('taskList', [paragraph(...content)]));
    expect(stored(roundTrip(doc))).toEqual(stored(doc));
  });

  propertyTest.prop([
    fc.string({ unit: fc.constantFrom(...TRICKY_CHARACTERS, '\n') }),
  ])('in a code block', (code) => {
    const doc = docOf(codeBlock(code));
    expect(stored(roundTrip(doc))).toEqual(stored(doc));
  });
});

const nonEmptyLine = line.map((content) => paragraph(...content));

const code = fc.string({
  unit: fc.constantFrom('a', ' ', '`', '~', '\n', '<', '>', '-', '#'),
  maxLength: 12,
});

const answerBlock = fc.oneof(
  nonEmptyLine,
  code.map((value) => codeBlock(value)),
  fc
    .array(line, { minLength: 1, maxLength: 3 })
    .map((items) =>
      listOf('bulletList', ...items.map((content) => [paragraph(...content)])),
    ),
);

const leafBlock = fc.oneof(
  { weight: 4, arbitrary: nonEmptyLine },
  {
    weight: 1,
    arbitrary: fc
      .tuple(fc.constantFrom(1, 2, 3), line)
      .map(([level, content]) => ({
        type: 'heading',
        attrs: { level },
        content,
      })),
  },
  {
    weight: 1,
    arbitrary: fc
      .tuple(code, fc.constantFrom(undefined, 'ts'))
      .map(([value, language]) => codeBlock(value, language)),
  },
  {
    weight: 1,
    arbitrary: fc.constant<JSONContent>({ type: 'horizontalRule' }),
  },
  {
    weight: 1,
    arbitrary: fc
      .tuple(line, fc.array(answerBlock, { minLength: 1, maxLength: 3 }))
      .map(([question, answer]) => card(question, ...answer)),
  },
);

function withEmptyLinesBetween(blocks: JSONContent[], gaps: number[]) {
  return blocks.flatMap((block, index) => [
    ...(index
      ? Array.from({ length: gaps[index] ?? 0 }, () => paragraph())
      : []),
    block,
  ]);
}

const { flow } = fc.letrec<{
  flow: JSONContent[];
  block: JSONContent;
  list: JSONContent;
  item: JSONContent[];
}>((tie) => ({
  flow: fc
    .tuple(
      fc.array(tie('block'), { minLength: 1, maxLength: 4 }),
      fc.array(fc.nat(2), { maxLength: 4 }),
    )
    .map(([blocks, gaps]) => withEmptyLinesBetween(blocks, gaps)),
  block: fc.oneof(
    { depthSize: 'small', withCrossShrink: true },
    leafBlock,
    tie('list'),
    tie('flow').map((content) => ({ type: 'blockquote', content })),
  ),
  item: fc
    .tuple(
      fc.option(line, { nil: null }),
      fc.array(tie('block'), { maxLength: 2 }),
    )
    .map(([first, blocks]) => [paragraph(...(first ?? [])), ...blocks]),
  list: fc
    .tuple(
      fc.constantFrom('bulletList', 'orderedList', 'taskList'),
      fc.array(tie('item'), { minLength: 1, maxLength: 3 }),
      fc.nat(12),
      fc.boolean(),
    )
    .map(([type, items, start, checked]) => ({
      type,
      ...(type === 'orderedList' ? { attrs: { start } } : {}),
      content: items.map((content) => ({
        type: type === 'taskList' ? 'taskItem' : 'listItem',
        ...(type === 'taskList' ? { attrs: { checked } } : {}),
        content,
      })),
    })),
}));

describe('any arrangement of blocks survives Markdown and back', () => {
  propertyTest.prop([flow])(
    'nested lists, quotes, cards and empty lines',
    (content) => {
      const doc = docOf(...content);
      expect(stored(roundTrip(doc))).toEqual(stored(doc));
    },
  );
});
