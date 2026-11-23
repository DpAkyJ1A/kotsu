import type { Node } from '@tiptap/pm/model';

const BLOCK_BREAK = '\u2029';
const LEAF = ' ';

export type TextCounts = { words: number; characters: number };

export function textCountsOf(doc: Node): TextCounts {
  const text = doc.textBetween(0, doc.content.size, BLOCK_BREAK, LEAF);
  return {
    words: wordsIn(text),
    characters: charactersIn(text.replaceAll(BLOCK_BREAK, '')),
  };
}

function charactersIn(text: string) {
  if (!('Segmenter' in Intl)) return Array.from(text).length;
  return Array.from(new Intl.Segmenter().segment(text)).length;
}

function wordsIn(text: string) {
  return text.split(/\s+/u).filter((word) => word !== '').length;
}
