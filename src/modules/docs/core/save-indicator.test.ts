import { describe, expect, test } from 'vitest';

import {
  filledPercentOf,
  saveIndicatorOf,
  shownSizeOf,
} from './save-indicator';
import { LARGEST_DOC_BYTES } from './save-limits';
import type { SaveStatus } from './save-state';

function percentOfTheLargestDoc(percent: number) {
  return (LARGEST_DOC_BYTES * percent) / 100;
}

describe('how full the doc is', () => {
  test.each([
    ['an empty doc', 0, 'roomy', false],
    ['a doc at 79 %', percentOfTheLargestDoc(79), 'roomy', false],
    ['a doc a byte under 80 %', percentOfTheLargestDoc(80) - 1, 'roomy', false],
    ['a doc at 80 %', percentOfTheLargestDoc(80), 'filling', true],
    [
      'a doc a byte under 90 %',
      percentOfTheLargestDoc(90) - 1,
      'filling',
      true,
    ],
    ['a doc at 90 %', percentOfTheLargestDoc(90), 'almostFull', true],
    [
      'a doc at 100 %, which still saves',
      LARGEST_DOC_BYTES,
      'almostFull',
      true,
    ],
    ['a doc a byte over 100 %', LARGEST_DOC_BYTES + 1, 'overfull', true],
  ] as const)(
    '%s is %s, and shows the fill in the bar: %s',
    (_, sizeBytes, fill, showsTheFill) => {
      expect(saveIndicatorOf('saved', sizeBytes)).toMatchObject({
        fill,
        showsTheFill,
      });
    },
  );
});

describe('what the indicator shows', () => {
  test.each<[SaveStatus, string]>([
    ['saving', 'saving'],
    ['saved', 'saved'],
    ['offline', 'problem'],
    ['tooLong', 'problem'],
    ['storageFull', 'problem'],
    ['notSaved', 'problem'],
  ])('marks %s as %s', (status, mark) => {
    expect(saveIndicatorOf(status, 0).mark).toBe(mark);
  });

  test('warns that the doc is almost full from 90 %, while it saves and once it has', () => {
    for (const status of ['saving', 'saved'] as const) {
      expect(
        saveIndicatorOf(status, percentOfTheLargestDoc(90))
          .warnsTheDocIsAlmostFull,
      ).toBe(true);
      expect(
        saveIndicatorOf(status, percentOfTheLargestDoc(90) - 1)
          .warnsTheDocIsAlmostFull,
      ).toBe(false);
    }
  });

  test('keeps warning over 100 %, should a doc that big ever save', () => {
    expect(
      saveIndicatorOf('saved', LARGEST_DOC_BYTES + 1).warnsTheDocIsAlmostFull,
    ).toBe(true);
  });

  test('says the problem instead of the warning when a save failed, so one word stands beside the mark', () => {
    for (const status of ['offline', 'storageFull', 'notSaved'] as const) {
      expect(
        saveIndicatorOf(status, percentOfTheLargestDoc(95))
          .warnsTheDocIsAlmostFull,
      ).toBe(false);
    }
  });
});

describe('the size it shows', () => {
  test('fills the bar in whole percent, up to full', () => {
    expect(filledPercentOf(percentOfTheLargestDoc(80))).toBe(80);
    expect(filledPercentOf(percentOfTheLargestDoc(91.6))).toBe(92);
    expect(filledPercentOf(LARGEST_DOC_BYTES * 2)).toBe(100);
  });

  test('rounds a size over the cap up to the next kB, so a full doc never reads as the cap itself', () => {
    expect(shownSizeOf(LARGEST_DOC_BYTES + 1)).toBe(LARGEST_DOC_BYTES + 1_000);
    expect(shownSizeOf(LARGEST_DOC_BYTES + 1_000)).toBe(
      LARGEST_DOC_BYTES + 1_000,
    );
  });

  test('shows a size up to the cap as it is', () => {
    expect(shownSizeOf(LARGEST_DOC_BYTES)).toBe(LARGEST_DOC_BYTES);
    expect(shownSizeOf(2_400)).toBe(2_400);
  });
});
