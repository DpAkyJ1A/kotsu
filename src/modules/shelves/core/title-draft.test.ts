import { describe, expect, test } from 'vitest';

import { oneLine, titleToSave } from './title-draft';

describe('oneLine', () => {
  test('turns pasted line breaks into single spaces', () => {
    expect(oneLine('Spanish\nverbs \r\n\n in the present')).toBe(
      'Spanish verbs in the present',
    );
  });

  test('leaves a title without line breaks as it was, spaces and all', () => {
    expect(oneLine(' Spanish  verbs ')).toBe(' Spanish  verbs ');
  });
});

describe('titleToSave', () => {
  test('saves the draft without the spaces around it', () => {
    expect(titleToSave('  Verbs, present tense ', 'Verbs')).toBe(
      'Verbs, present tense',
    );
  });

  test('saves nothing when the draft is the saved title', () => {
    expect(titleToSave('Verbs ', 'Verbs')).toBeNull();
  });

  test('saves nothing when the draft is empty, so the saved title stays', () => {
    expect(titleToSave('   ', 'Verbs')).toBeNull();
  });
});
