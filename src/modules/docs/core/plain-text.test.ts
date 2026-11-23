import type { JSONContent } from '@tiptap/core';
import { expect, test } from 'vitest';

import { plainTextOf } from './plain-text';

function text(value: string): JSONContent {
  return { type: 'text', text: value };
}

function paragraph(...content: JSONContent[]): JSONContent {
  return { type: 'paragraph', content };
}

function item(type: string, line: string): JSONContent {
  return { type, content: [paragraph(text(line))] };
}

test('puts every block on a line of its own, so words of two blocks never run together', () => {
  const doc: JSONContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [text('Present tense')],
      },
      paragraph(text('Regular verbs end in '), text('-ar'), text(' or -er.')),
      {
        type: 'bulletList',
        content: [item('listItem', 'yo hablo'), item('listItem', 'tú hablas')],
      },
      {
        type: 'taskList',
        content: [item('taskItem', 'Conjugate ten verbs')],
      },
      { type: 'blockquote', content: [paragraph(text('Poco a poco.'))] },
      { type: 'codeBlock', content: [text('hablar\ncomer')] },
      { type: 'horizontalRule' },
      paragraph(text('Line one'), { type: 'hardBreak' }, text('line two')),
    ],
  };

  expect(plainTextOf(doc)).toBe(
    [
      'Present tense',
      'Regular verbs end in -ar or -er.',
      'yo hablo',
      'tú hablas',
      'Conjugate ten verbs',
      'Poco a poco.',
      'hablar\ncomer',
      'Line one\nline two',
    ].join('\n'),
  );
});

test('leaves out empty lines and dividers', () => {
  expect(
    plainTextOf({
      type: 'doc',
      content: [
        paragraph(),
        { type: 'horizontalRule' },
        paragraph(text('hola')),
        { type: 'paragraph' },
      ],
    }),
  ).toBe('hola');
});

test('gives an empty doc no text', () => {
  expect(plainTextOf({ type: 'doc', content: [paragraph()] })).toBe('');
});
