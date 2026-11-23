import { getSchema, type JSONContent } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { DocKit } from './doc-kit';
import { textCountsOf } from './text-counts';

const schema = getSchema([DocKit]);

function docOf(...content: JSONContent[]) {
  return Node.fromJSON(schema, { type: 'doc', content });
}

function paragraph(...content: JSONContent[]): JSONContent {
  return { type: 'paragraph', content };
}

function text(value: string): JSONContent {
  return { type: 'text', text: value };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('counting the characters', () => {
  test('counts an accented letter and an emoji as one character each, as the eye does', () => {
    expect(textCountsOf(docOf(paragraph(text('mañana 🎸')))).characters).toBe(
      8,
    );
    expect(
      textCountsOf(docOf(paragraph(text('man\u0303ana')))).characters,
    ).toBe(6);
    expect(textCountsOf(docOf(paragraph(text('👩🏽‍🎤')))).characters).toBe(1);
  });

  test('counts no character between two blocks, only the spaces typed', () => {
    const doc = docOf(paragraph(text('hola')), paragraph(text('amigo')));

    expect(textCountsOf(doc).characters).toBe(9);
  });

  test('counts a line break inside a block as a character', () => {
    const doc = docOf(
      paragraph(text('hola'), { type: 'hardBreak' }, text('amigo')),
      {
        type: 'codeBlock',
        content: [text('const a = 1;\nconst b = 2;')],
      },
    );

    expect(textCountsOf(doc).characters).toBe(10 + 25);
  });

  test('counts nothing in an empty doc', () => {
    expect(textCountsOf(docOf(paragraph()))).toEqual({
      words: 0,
      characters: 0,
    });
  });

  test('counts code points in a browser without Intl.Segmenter, rather than failing', () => {
    vi.stubGlobal('Intl', {});

    expect(textCountsOf(docOf(paragraph(text('mañana 🎸')))).characters).toBe(
      8,
    );
    expect(
      textCountsOf(docOf(paragraph(text('man\u0303ana')))).characters,
    ).toBe(7);
  });
});

describe('counting the words', () => {
  test('splits on any run of spaces, tabs and line breaks, as in a code block', () => {
    const doc = docOf({
      type: 'codeBlock',
      content: [text('  hablo   español\n\tcon  amigos ')],
    });

    expect(textCountsOf(doc).words).toBe(4);
  });

  test('counts words in two blocks apart, though no space stands between them', () => {
    const doc = docOf(
      { type: 'heading', attrs: { level: 1 }, content: [text('Guitar')] },
      paragraph(text('Practise'), { type: 'hardBreak' }, text('chords')),
    );

    expect(textCountsOf(doc).words).toBe(3);
  });

  test('counts nothing in a doc of spaces only', () => {
    expect(textCountsOf(docOf(paragraph(text(' \t ')))).words).toBe(0);
  });
});
