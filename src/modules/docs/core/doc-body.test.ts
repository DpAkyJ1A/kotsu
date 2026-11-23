import type { JSONContent } from '@tiptap/core';
import { describe, expect, test } from 'vitest';

import { DocBody } from './doc-body';

const BLOCK_ID = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f01';

function text(value: string): JSONContent {
  return { type: 'text', text: value };
}

function paragraph(value: string, attrs?: Record<string, unknown>) {
  return { type: 'paragraph', ...(attrs && { attrs }), content: [text(value)] };
}

function docOf(...content: unknown[]) {
  return { type: 'doc', content };
}

const EVERY_BLOCK_AT_ITS_DEFAULTS = docOf(
  { type: 'heading', attrs: { level: 1 }, content: [text('Verbs')] },
  paragraph('Regular verbs'),
  {
    type: 'bulletList',
    content: [{ type: 'listItem', content: [paragraph('hablar')] }],
  },
  {
    type: 'orderedList',
    content: [{ type: 'listItem', content: [paragraph('comer')] }],
  },
  {
    type: 'taskList',
    content: [{ type: 'taskItem', content: [paragraph('vivir')] }],
  },
  { type: 'blockquote', content: [paragraph('Poco a poco.')] },
  { type: 'codeBlock', content: [text('yo hablo')] },
  { type: 'horizontalRule' },
);

describe('DocBody', () => {
  test('takes a doc with every block, each attribute at its default, and gives back the doc as the schema reads it', () => {
    const body = DocBody.parse(EVERY_BLOCK_AT_ITS_DEFAULTS);

    expect(body.content?.[0]).toEqual({
      type: 'heading',
      attrs: { blockId: null, level: 1 },
      content: [text('Verbs')],
    });
    expect(body.content?.[3]?.attrs).toEqual({ start: 1, type: null });
  });

  test('takes the values its attributes may have', () => {
    expect(
      DocBody.safeParse(
        docOf(
          {
            type: 'heading',
            attrs: { level: 3, blockId: BLOCK_ID },
            content: [text('Practice')],
          },
          {
            type: 'orderedList',
            attrs: { start: 0, type: 'a' },
            content: [{ type: 'listItem', content: [paragraph('comer')] }],
          },
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: true },
                content: [paragraph('vivir')],
              },
            ],
          },
          {
            type: 'codeBlock',
            attrs: { language: 'js' },
            content: [text('yo hablo')],
          },
        ),
      ).success,
    ).toBe(true);
  });

  test('drops an attribute the schema does not know instead of keeping it', () => {
    expect(
      DocBody.parse(docOf(paragraph('hola', { onclick: 'alert(1)' }))),
    ).toEqual(docOf(paragraph('hola', { blockId: null })));
  });

  test.each<[string, unknown]>([
    ['a root that is not a doc', paragraph('hola')],
    ['a node it does not know', docOf({ type: 'image' })],
    ['a block in the wrong place', docOf({ type: 'listItem', content: [] })],
    ['heading level 4', docOf({ type: 'heading', attrs: { level: 4 } })],
    [
      'a block id that is not a uuid',
      docOf(paragraph('hola', { blockId: 'x' })),
    ],
    [
      'a checklist item ticked with a string',
      docOf({
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: 'true' },
            content: [paragraph('vivir')],
          },
        ],
      }),
    ],
    [
      'a numbered list that starts below zero',
      docOf({
        type: 'orderedList',
        attrs: { start: -1 },
        content: [{ type: 'listItem', content: [paragraph('comer')] }],
      }),
    ],
    [
      'a numbered list in a style HTML does not have',
      docOf({
        type: 'orderedList',
        attrs: { type: 'x' },
        content: [{ type: 'listItem', content: [paragraph('comer')] }],
      }),
    ],
    [
      'a code block whose language is not text',
      docOf({ type: 'codeBlock', attrs: { language: 1 } }),
    ],
    [
      'an unknown node type named like a property of every object',
      docOf({ type: '__proto__' }),
    ],
    ['a list of blocks instead of a doc', [paragraph('hola')]],
    ['text', 'hola'],
    ['null', null],
  ])('refuses %s', (_, json) => {
    expect(DocBody.safeParse(json).success).toBe(false);
  });
});
