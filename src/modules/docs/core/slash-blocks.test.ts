import { describe, expect, test } from 'vitest';

import {
  findSlashBlocks,
  isSlashMenuOpen,
  type SlashBlock,
} from './slash-blocks';

const ENGLISH: Record<SlashBlock, string> = {
  text: 'Text',
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  bulletList: 'Bulleted list',
  orderedList: 'Numbered list',
  taskList: 'Checklist',
  card: 'Card',
  blockquote: 'Quote',
  codeBlock: 'Code',
  horizontalRule: 'Divider',
};

const RUSSIAN: Record<SlashBlock, string> = {
  text: 'Текст',
  heading1: 'Заголовок 1',
  heading2: 'Заголовок 2',
  heading3: 'Заголовок 3',
  bulletList: 'Маркированный список',
  orderedList: 'Нумерованный список',
  taskList: 'Чеклист',
  card: 'Карточка',
  blockquote: 'Цитата',
  codeBlock: 'Код',
  horizontalRule: 'Разделитель',
};

function inEnglish(query: string) {
  return findSlashBlocks(query, (block) => ENGLISH[block]);
}

function inRussian(query: string) {
  return findSlashBlocks(query, (block) => RUSSIAN[block]);
}

function isOpenInEnglish(query: string, { wasOpen }: { wasOpen: boolean }) {
  return isSlashMenuOpen({
    query,
    wasOpen,
    labelOf: (block) => ENGLISH[block],
  });
}

describe('findSlashBlocks', () => {
  test('lists every block, the card first, before anything is typed', () => {
    expect(inEnglish('')).toEqual([
      'card',
      'text',
      'heading1',
      'heading2',
      'heading3',
      'bulletList',
      'orderedList',
      'taskList',
      'blockquote',
      'codeBlock',
      'horizontalRule',
    ]);
  });

  test('finds the start of any word of a label', () => {
    expect(inEnglish('head')).toEqual(['heading1', 'heading2', 'heading3']);
    expect(inEnglish('list')).toEqual([
      'bulletList',
      'orderedList',
      'taskList',
    ]);
    expect(inEnglish('num')).toEqual(['orderedList']);
  });

  test('finds a label typed as one word, without its spaces', () => {
    expect(inEnglish('heading2')).toEqual(['heading2']);
    expect(inEnglish('numberedl')).toEqual(['orderedList']);
  });

  test('finds a query of several words when each starts a word of the label, in order', () => {
    expect(inEnglish('heading 2')).toEqual(['heading2']);
    expect(inEnglish('bul list')).toEqual(['bulletList']);
    expect(inEnglish('num l')).toEqual(['orderedList']);
    expect(inRussian('заг 2')).toEqual(['heading2']);
    expect(inRussian('мар спи')).toEqual(['bulletList']);
  });

  test('finds nothing when the words of a query come in another order', () => {
    expect(inEnglish('list bul')).toEqual([]);
    expect(inEnglish('2 heading')).toEqual([]);
  });

  test('finds nothing when two words of a query would start the same word of the label', () => {
    expect(inEnglish('list list')).toEqual([]);
    expect(inEnglish('head heading')).toEqual([]);
  });

  test('finds nothing when the words of a query split a word of the label', () => {
    expect(inEnglish('head ing')).toEqual([]);
    expect(inEnglish('bul leted')).toEqual([]);
  });

  test('takes a space at the end of a query as no space', () => {
    expect(inEnglish('list ')).toEqual(inEnglish('list'));
    expect(inEnglish('heading 2 ')).toEqual(['heading2']);
  });

  test('ignores case', () => {
    expect(inEnglish('QUO')).toEqual(['blockquote']);
    expect(inRussian('ЦИТ')).toEqual(['blockquote']);
  });

  test('finds the label in the user’s language', () => {
    expect(inRussian('заг')).toEqual(['heading1', 'heading2', 'heading3']);
    expect(inRussian('спис')).toEqual(['bulletList', 'orderedList']);
    expect(inRussian('разд')).toEqual(['horizontalRule']);
  });

  test.each<[string, SlashBlock[]]>([
    ['h1', ['heading1']],
    ['h2', ['heading2']],
    ['h3', ['heading3']],
    ['ul', ['bulletList']],
    ['ol', ['orderedList']],
    ['todo', ['taskList']],
    ['quote', ['blockquote']],
    ['code', ['codeBlock']],
    ['hr', ['horizontalRule']],
    ['heading 2', ['heading2']],
    ['bulleted list', ['bulletList']],
    ['numbered list', ['orderedList']],
    ['ordered list', ['orderedList']],
    ['task list', ['taskList']],
    ['todo list', ['taskList']],
    ['code block', ['codeBlock']],
    ['horizontal rule', ['horizontalRule']],
  ])('finds “%s” by its English keyword in any language', (query, blocks) => {
    expect(inRussian(query)).toEqual(blocks);
    expect(inEnglish(query)).toEqual(blocks);
  });

  test('finds nothing for letters in the middle of a word', () => {
    expect(inEnglish('ext')).toEqual([]);
    expect(inEnglish('zzz')).toEqual([]);
  });
});

describe('isSlashMenuOpen', () => {
  test('opens for a query without a space, whether it finds a block or not', () => {
    expect(isOpenInEnglish('', { wasOpen: false })).toBe(true);
    expect(isOpenInEnglish('h2', { wasOpen: false })).toBe(true);
    expect(isOpenInEnglish('zzz', { wasOpen: true })).toBe(true);
  });

  test('keeps an open menu open over a space while the query finds a block', () => {
    expect(isOpenInEnglish('heading ', { wasOpen: true })).toBe(true);
    expect(isOpenInEnglish('heading 2', { wasOpen: true })).toBe(true);
  });

  test('closes it over a space once the query finds nothing', () => {
    expect(isOpenInEnglish('zzz ', { wasOpen: true })).toBe(false);
    expect(isOpenInEnglish('heading 4', { wasOpen: true })).toBe(false);
  });

  test('never opens a closed menu for a query with a space, even one that finds a block', () => {
    expect(isOpenInEnglish('heading 2', { wasOpen: false })).toBe(false);
    expect(isOpenInEnglish('heading ', { wasOpen: false })).toBe(false);
  });

  test('closes it for a space right after “/”, as the start of plain text', () => {
    expect(isOpenInEnglish(' ', { wasOpen: true })).toBe(false);
    expect(isOpenInEnglish(' h', { wasOpen: true })).toBe(false);
  });
});
