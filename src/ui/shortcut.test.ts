import { describe, expect, test } from 'vitest';

import { isApplePlatform, isShortcut } from './shortcut';

const COMMAND_K = {
  metaKey: true,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  key: 'k',
  code: 'KeyK',
  repeat: false,
  defaultPrevented: false,
};

describe('shortcut', () => {
  test.each([
    ['⌘K', COMMAND_K],
    ['Ctrl+K', { ...COMMAND_K, metaKey: false, ctrlKey: true }],
    [
      '⌘K on a Russian layout, where the key types л',
      { ...COMMAND_K, key: 'л' },
    ],
  ])('is %s', (_, event) => {
    expect(isShortcut(event, 'KeyK')).toBe(true);
  });

  test.each([
    ['K alone', { ...COMMAND_K, metaKey: false }],
    ['⌥⌘K', { ...COMMAND_K, altKey: true }],
    ['⇧⌘K', { ...COMMAND_K, shiftKey: true }],
    ['⌘J', { ...COMMAND_K, code: 'KeyJ' }],
    ['a held ⌘K repeating', { ...COMMAND_K, repeat: true }],
    ['⌘K the page has handled', { ...COMMAND_K, defaultPrevented: true }],
  ])('is not %s', (_, event) => {
    expect(isShortcut(event, 'KeyK')).toBe(false);
  });
});

describe('Apple platform', () => {
  test.each([
    [
      'a Mac',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    ],
    [
      'an iPhone',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1',
    ],
    [
      'an iPad',
      'Mozilla/5.0 (iPad; CPU OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1',
    ],
  ])('is %s', (_, userAgent) => {
    expect(isApplePlatform(userAgent)).toBe(true);
  });

  test.each([
    [
      'Windows',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    ],
    [
      'Linux',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/142.0.0.0 Safari/537.36',
    ],
    ['a request without a user agent', ''],
  ])('is not %s', (_, userAgent) => {
    expect(isApplePlatform(userAgent)).toBe(false);
  });
});
