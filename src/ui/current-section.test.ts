import { describe, expect, test } from 'vitest';

import { isCurrentSection } from './current-section';

describe('current section', () => {
  test.each(['/shelves', '/shelves/spanish', '/shelves/spanish/verbs'])(
    'is Shelves on %s',
    (pathname) => {
      expect(isCurrentSection(pathname, '/shelves')).toBe(true);
    },
  );

  test.each(['/calendar', '/shelvesx', '/shelves-archive'])(
    'is not Shelves on %s',
    (pathname) => {
      expect(isCurrentSection(pathname, '/shelves')).toBe(false);
    },
  );
});
