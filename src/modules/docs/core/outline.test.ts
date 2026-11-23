import { getSchema, type JSONContent } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { describe, expect, test } from 'vitest';

import { DocKit } from './doc-kit';
import { currentHeadingOf, outlineOf } from './outline';

const schema = getSchema([DocKit]);

function docOf(...content: JSONContent[]) {
  return Node.fromJSON(schema, { type: 'doc', content });
}

function text(value: string): JSONContent {
  return { type: 'text', text: value };
}

function paragraph(value: string): JSONContent {
  return { type: 'paragraph', content: [text(value)] };
}

function heading(
  level: number,
  blockId: string,
  ...content: JSONContent[]
): JSONContent {
  return { type: 'heading', attrs: { level, blockId }, content };
}

function namesIn(doc: Node) {
  return outlineOf(doc).map(({ text, depth }) => ({ text, depth }));
}

describe('the outline of a doc', () => {
  test('lists the headings in the order of the doc, each with the position the editor finds it at', () => {
    const doc = docOf(
      paragraph('Regular verbs end in -ar, -er or -ir.'),
      heading(1, 'present', text('Present tense')),
      paragraph('yo hablo'),
      heading(2, 'hablar', text('Hablar, to speak')),
    );

    const outline = outlineOf(doc);

    expect(outline.map(({ blockId }) => blockId)).toEqual([
      'present',
      'hablar',
    ]);
    for (const { blockId, position } of outline) {
      expect(doc.nodeAt(position)?.attrs.blockId).toBe(blockId);
    }
  });

  test('indents a heading by its level below the highest level in the doc', () => {
    const doc = docOf(
      heading(2, 'verbs', text('Verbs')),
      heading(3, 'ser', text('Ser')),
      heading(3, 'estar', text('Estar')),
      heading(2, 'nouns', text('Nouns')),
    );

    expect(namesIn(doc)).toEqual([
      { text: 'Verbs', depth: 0 },
      { text: 'Ser', depth: 1 },
      { text: 'Estar', depth: 1 },
      { text: 'Nouns', depth: 0 },
    ]);
  });

  test('keeps a skipped level as deep as the level says', () => {
    const doc = docOf(
      heading(1, 'guitar', text('Guitar')),
      heading(3, 'barre', text('Barre chords')),
    );

    expect(namesIn(doc)).toEqual([
      { text: 'Guitar', depth: 0 },
      { text: 'Barre chords', depth: 2 },
    ]);
  });

  test('leaves out a heading with no text, or only spaces, which has nothing to show', () => {
    const doc = docOf(
      heading(1, 'empty'),
      heading(2, 'spaces', text('   ')),
      heading(2, 'running', text('Running')),
    );

    expect(namesIn(doc)).toEqual([{ text: 'Running', depth: 0 }]);
  });

  test('finds a heading inside a list item or a quote too', () => {
    const doc = docOf(
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              paragraph('yo hablo'),
              heading(2, 'in-a-list', text('Ser')),
            ],
          },
        ],
      },
      {
        type: 'blockquote',
        content: [heading(3, 'in-a-quote', text('Estar'))],
      },
    );

    expect(namesIn(doc)).toEqual([
      { text: 'Ser', depth: 0 },
      { text: 'Estar', depth: 1 },
    ]);
  });

  test('reads a line break in a heading as a space and trims the ends', () => {
    const doc = docOf(
      heading(
        1,
        'trip',
        text(' Spanish'),
        { type: 'hardBreak' },
        text('for the trip '),
      ),
    );

    expect(namesIn(doc)).toEqual([{ text: 'Spanish for the trip', depth: 0 }]);
  });

  test('is empty for a doc without headings', () => {
    expect(outlineOf(docOf(paragraph('Just a note')))).toEqual([]);
  });
});

describe('the current heading', () => {
  const tops = [
    { blockId: 'present', top: -400 },
    { blockId: 'hablar', top: 40 },
    { blockId: 'comer', top: 300 },
  ];

  test('is the last heading at or above the reading line', () => {
    expect(currentHeadingOf(tops, 112)).toBe('hablar');
    expect(currentHeadingOf(tops, 300)).toBe('comer');
  });

  test('is none above the first heading', () => {
    expect(currentHeadingOf(tops, -500)).toBeUndefined();
  });

  test('is not a heading a whole pixel below the line', () => {
    expect(currentHeadingOf(tops, 299)).toBe('hablar');
  });

  test('counts a heading scrolled to the line but a fraction of a pixel below it', () => {
    expect(currentHeadingOf([{ blockId: 'comer', top: 112.6 }], 112)).toBe(
      'comer',
    );
  });
});
