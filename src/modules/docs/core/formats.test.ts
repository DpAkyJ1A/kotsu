import { describe, expect, test } from 'vitest';

import { type Format, isMark, isToggle, markdownOf } from './formats';

describe('markdownOf', () => {
  test.each([
    ['bold', '**texto**'],
    ['italic', '*texto*'],
    ['strike', '~~texto~~'],
    ['code', '`texto`'],
  ] as const)('%s wraps the sample text: %s', (format, markdown) => {
    expect(markdownOf(format, 'texto')).toBe(markdown);
  });

  test.each([
    ['heading1', '#'],
    ['heading2', '##'],
    ['heading3', '###'],
    ['bulletList', '-'],
    ['orderedList', '1.'],
    ['taskList', '[]'],
    ['blockquote', '>'],
    ['codeBlock', '```'],
    ['horizontalRule', '---'],
  ] as const)(
    '%s starts a line with %s, without the sample',
    (format, markdown) => {
      expect(markdownOf(format, 'texto')).toBe(markdown);
    },
  );
});

describe('kinds of format', () => {
  test.each<Format>(['bold', 'italic', 'strike', 'code'])(
    '%s is a mark',
    (format) => {
      expect(isMark(format)).toBe(true);
    },
  );

  test.each<Format>(['heading2', 'codeBlock', 'horizontalRule'])(
    '%s is not a mark',
    (format) => {
      expect(isMark(format)).toBe(false);
    },
  );

  test('the divider is the one format that is not a toggle', () => {
    expect(isToggle('horizontalRule')).toBe(false);
    expect(isToggle('bold')).toBe(true);
    expect(isToggle('codeBlock')).toBe(true);
  });
});
