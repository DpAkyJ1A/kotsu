import type { JSONContent } from '@tiptap/core';
import type { MarkedToken, Tokens } from 'marked';

import { isColour } from '../colours';
import { asMarkedTokens } from './lexer';

type Mark = NonNullable<JSONContent['marks']>[number];

type OpenTag = { name: string; mark: Mark | null };

const MARK_TAGS: Record<string, string> = {
  strong: 'bold',
  b: 'bold',
  em: 'italic',
  i: 'italic',
  s: 'strike',
  del: 'strike',
  strike: 'strike',
};

const HTML_ESCAPES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

export function inlineFromMarkdown(tokens: MarkedToken[]): JSONContent[] {
  return nodesOf(tokens, []);
}

function nodesOf(tokens: MarkedToken[], marks: Mark[]): JSONContent[] {
  const nodes: JSONContent[] = [];
  const tags: OpenTag[] = [];
  const currentMarks = () =>
    tags.reduce((all, { mark }) => (mark ? withMark(all, mark) : all), marks);
  for (const token of tokens) {
    if (token.type === 'html') {
      nodes.push(...nodesOfTag(token.raw, tags, currentMarks()));
    } else {
      nodes.push(...nodesOfToken(token, currentMarks()));
    }
  }
  return nodes;
}

function nodesOfTag(raw: string, tags: OpenTag[], marks: Mark[]) {
  const html = raw.trim();
  if (/^<!--[\s\S]*-->$/.test(html)) return [];
  const tag = /^<(\/?)([a-z]+)\b[^>]*>$/i.exec(html);
  if (!tag) return text(raw, marks);
  const [, slash, tagName = ''] = tag;
  const name = tagName.toLowerCase();
  if (name === 'br') return [hardBreak(marks)];
  if (slash) return closeTag(name, raw, tags, marks);
  const mark = markOfTag(name, raw);
  if (mark || name === 'span') tags.push({ name, mark });
  return mark ? [] : text(raw, marks);
}

function closeTag(name: string, raw: string, tags: OpenTag[], marks: Mark[]) {
  const index = tags.findLastIndex((tag) => tag.name === name);
  const open = tags[index];
  if (!open) return text(raw, marks);
  tags.splice(index, 1);
  return open.mark ? [] : text(raw, marks);
}

function markOfTag(name: string, raw: string): Mark | null {
  const type = MARK_TAGS[name];
  if (type) return { type };
  if (name !== 'span') return null;
  const color = colourIn(raw, 'data-color');
  const backgroundColor = colourIn(raw, 'data-bg');
  return color || backgroundColor
    ? { type: 'textStyle', attrs: { color, backgroundColor } }
    : null;
}

function colourIn(raw: string, attribute: string) {
  const value = new RegExp(`\\s${attribute}\\s*=\\s*["']?([\\w-]+)`, 'i').exec(
    raw,
  )?.[1];
  return isColour(value) ? value : null;
}

function nodesOfToken(token: MarkedToken, marks: Mark[]): JSONContent[] {
  switch (token.type) {
    case 'text':
      return token.tokens?.length
        ? nodesOf(asMarkedTokens(token.tokens), marks)
        : text(unescapedHtml(token.text), marks);
    case 'escape':
      return text(unescapedHtml(token.text), marks);
    case 'strong':
      return nodesOf(
        asMarkedTokens(token.tokens),
        withMark(marks, { type: 'bold' }),
      );
    case 'em':
      return nodesOf(
        asMarkedTokens(token.tokens),
        withMark(marks, { type: 'italic' }),
      );
    case 'del':
      return nodesOf(
        asMarkedTokens(token.tokens),
        withMark(marks, { type: 'strike' }),
      );
    case 'codespan':
      return text(token.text, [{ type: 'code' }]);
    case 'br':
      return [hardBreak(marks)];
    case 'link':
      return linkNodes(token, marks);
    case 'image':
      return text(token.text, marks);
    case 'checkbox':
      return [];
    case 'html':
    case 'blockquote':
    case 'code':
    case 'def':
    case 'heading':
    case 'hr':
    case 'list':
    case 'list_item':
    case 'paragraph':
    case 'space':
    case 'table':
      return text(token.raw, marks);
  }
}

function linkNodes(link: Tokens.Link, marks: Mark[]) {
  const words = nodesOf(asMarkedTokens(link.tokens), marks);
  return isSpelledOut(link)
    ? words
    : [...words, ...text(` (${link.href})`, marks)];
}

function isSpelledOut({ href, text: words }: Tokens.Link) {
  const bare = (url: string) => url.replace(/^(https?:\/\/|mailto:)/i, '');
  return bare(href) === bare(words);
}

function withMark(marks: Mark[], mark: Mark): Mark[] {
  const same = marks.find(({ type }) => type === mark.type);
  if (!same) return [...marks, mark];
  if (mark.type !== 'textStyle') return marks;
  const merged: Mark = {
    type: mark.type,
    attrs: {
      color: attributeOf(mark, 'color') ?? attributeOf(same, 'color'),
      backgroundColor:
        attributeOf(mark, 'backgroundColor') ??
        attributeOf(same, 'backgroundColor'),
    },
  };
  return marks.map((each) => (each === same ? merged : each));
}

function attributeOf(mark: Mark, name: string) {
  const value: unknown = mark.attrs?.[name];
  return value ?? null;
}

function text(value: string, marks: Mark[]): JSONContent[] {
  if (!value) return [];
  return [{ type: 'text', text: value, ...(marks.length ? { marks } : {}) }];
}

function hardBreak(marks: Mark[]): JSONContent {
  return { type: 'hardBreak', ...(marks.length ? { marks } : {}) };
}

function unescapedHtml(value: string) {
  return value.replace(
    /&(?:amp|lt|gt|quot|#39);/g,
    (escape) => HTML_ESCAPES[escape] ?? escape,
  );
}
