import { expect, test } from 'vitest';

import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

type MessageTree = { [key: string]: string | MessageTree };

// { home: { title } } → ['home.title']
function keysOf(messages: MessageTree, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [`${prefix}${key}`]
      : keysOf(value, `${prefix}${key}.`),
  );
}

// The types know only the English file, so a message missing in Russian would show its key on screen
test('Russian has every English message and no other', () => {
  expect(keysOf(ru).toSorted()).toEqual(keysOf(en).toSorted());
});
