import { getSchema, type JSONContent } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { describe, expect, test } from 'vitest';

import { DocKit } from './doc-kit';

const schema = getSchema([DocKit]);

function parse(json: JSONContent) {
  const doc = Node.fromJSON(schema, json);
  doc.check();
  return doc;
}

function text(value: string, marks?: string[]): JSONContent {
  return {
    type: 'text',
    text: value,
    ...(marks && { marks: marks.map((type) => ({ type })) }),
  };
}

function paragraph(...content: JSONContent[]): JSONContent {
  return { type: 'paragraph', content };
}

function docOf(...content: JSONContent[]): JSONContent {
  return { type: 'doc', content };
}

const EVERY_BLOCK = docOf(
  {
    type: 'heading',
    attrs: { level: 1, blockId: '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f01' },
    content: [text('Spanish verbs')],
  },
  paragraph(
    text('Regular verbs end in '),
    text('-ar', ['bold']),
    text(', '),
    text('-er', ['italic']),
    text(' or '),
    text('-ir', ['code']),
    text('; '),
    text('hablo', ['strike']),
  ),
  { type: 'heading', attrs: { level: 3 }, content: [text('Practice')] },
  {
    type: 'bulletList',
    content: [{ type: 'listItem', content: [paragraph(text('hablar'))] }],
  },
  {
    type: 'orderedList',
    content: [{ type: 'listItem', content: [paragraph(text('comer'))] }],
  },
  {
    type: 'taskList',
    content: [
      {
        type: 'taskItem',
        attrs: { checked: true },
        content: [paragraph(text('vivir'))],
      },
    ],
  },
  { type: 'blockquote', content: [paragraph(text('Poco a poco.'))] },
  { type: 'codeBlock', content: [text('yo hablo\ntú hablas')] },
  { type: 'horizontalRule' },
  paragraph(text('Line one'), { type: 'hardBreak' }, text('line two')),
);

test('builds the schema in Node, without a DOM, with the blocks and marks of Markdown only', () => {
  expect(typeof document).toBe('undefined');
  expect(Object.keys(schema.nodes).sort()).toEqual([
    'blockquote',
    'bulletList',
    'codeBlock',
    'doc',
    'hardBreak',
    'heading',
    'horizontalRule',
    'listItem',
    'orderedList',
    'paragraph',
    'taskItem',
    'taskList',
    'text',
  ]);
  expect(Object.keys(schema.marks).sort()).toEqual([
    'bold',
    'code',
    'italic',
    'strike',
  ]);
});

test('gives a blockId to every block that holds text and to every list item, and to nothing else', () => {
  const withBlockId = Object.values(schema.nodes)
    .filter((type) => 'blockId' in (type.spec.attrs ?? {}))
    .map(({ name }) => name)
    .sort();

  expect(withBlockId).toEqual([
    'blockquote',
    'codeBlock',
    'heading',
    'listItem',
    'paragraph',
    'taskItem',
  ]);
});

test('takes a doc with every block and every mark', () => {
  expect(parse(EVERY_BLOCK).toJSON()).toMatchObject(EVERY_BLOCK);
});

test.each<[string, JSONContent]>([
  ['a node it does not know', docOf({ type: 'image' })],
  [
    'underline, which Markdown has no way to write',
    docOf(paragraph(text('hola', ['underline']))),
  ],
  [
    'a link from the starter kit, since Kotsu brings its own (task 1.9)',
    docOf(paragraph(text('hola', ['link']))),
  ],
  [
    'a list item outside a list',
    docOf({ type: 'listItem', content: [paragraph(text('hola'))] }),
  ],
  ['a text node without text', docOf(paragraph(text('')))],
  [
    'a mark inside a code block',
    docOf({ type: 'codeBlock', content: [text('hola', ['bold'])] }),
  ],
  ['a doc with no block at all', docOf()],
])('refuses %s', (_, json) => {
  expect(() => parse(json)).toThrow();
});

describe('what the check leaves to saveDoc (task 1.5)', () => {
  test('drops an attribute it does not know instead of refusing it, so the doc to save is the parsed one', () => {
    const json = docOf({
      type: 'paragraph',
      attrs: { colour: 'red' },
      content: [text('hola')],
    });

    expect(parse(json).toJSON()).toEqual(
      docOf({
        type: 'paragraph',
        attrs: { blockId: null },
        content: [text('hola')],
      }),
    );
  });

  test('takes any value of a known attribute, such as heading level 7', () => {
    const json = docOf({
      type: 'heading',
      attrs: { level: 7 },
      content: [text('hola')],
    });

    expect(() => parse(json)).not.toThrow();
  });

  test('takes a root that is not a doc', () => {
    expect(parse(paragraph(text('hola'))).type.name).toBe('paragraph');
  });
});
