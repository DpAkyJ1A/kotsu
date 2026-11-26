import type { MarkedToken } from 'marked';

import { lexBlocks } from './lexer';

export type CardToken = {
  type: 'card';
  raw: string;
  question: string;
  answer: MarkdownBlock[];
};

export type MarkdownBlock = MarkedToken | CardToken;

const OPENING = /^\s*<details(?:\s[^>]*)?>/i;
const CLOSING = /<\/details\s*>/i;
const SUMMARY = /<summary(?:\s[^>]*)?>([\s\S]*?)<\/summary\s*>/i;

export function withCards(tokens: MarkedToken[]): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    index += 1;
    if (!token) break;
    if (!isOpening(token)) {
      blocks.push(token);
      continue;
    }
    const { question, inside } = questionOf(token.raw);
    if (CLOSING.test(inside)) {
      const [answer = '', after = ''] = splitAtClosing(inside);
      blocks.push(card(question, lexBlocks(answer), token.raw));
      blocks.push(...withCards(lexBlocks(after)));
      continue;
    }
    const end = closingIndex(tokens, index);
    const closing = tokens[end];
    const answer = [...lexBlocks(inside), ...tokens.slice(index, end)];
    blocks.push(card(question, answer, closing?.raw ?? ''));
    const [, after = ''] = splitAtClosing(closing?.raw ?? '');
    blocks.push(...withCards(lexBlocks(after)));
    index = end + 1;
  }
  return blocks;
}

function isOpening(token: MarkedToken) {
  return token.type === 'html' && OPENING.test(token.raw);
}

function isClosing(token: MarkedToken) {
  return token.type === 'html' && CLOSING.test(token.raw);
}

function questionOf(raw: string) {
  const afterOpening = raw.replace(OPENING, '');
  const summary = SUMMARY.exec(afterOpening);
  if (!summary) return { question: '', inside: afterOpening };
  return {
    question: summary[1] ?? '',
    inside: afterOpening.slice(summary.index + summary[0].length),
  };
}

function splitAtClosing(raw: string) {
  const closing = CLOSING.exec(raw);
  if (!closing) return [raw, ''];
  return [
    raw.slice(0, closing.index),
    raw.slice(closing.index + closing[0].length),
  ];
}

function closingIndex(tokens: MarkedToken[], from: number) {
  let depth = 1;
  for (let index = from; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) break;
    if (isOpening(token) && !isClosing(token)) depth += 1;
    if (isClosing(token) && !isOpening(token)) depth -= 1;
    if (depth === 0) return index;
  }
  return tokens.length;
}

function card(question: string, answer: MarkedToken[], raw: string): CardToken {
  return { type: 'card', raw, question, answer: withCards(answer) };
}
