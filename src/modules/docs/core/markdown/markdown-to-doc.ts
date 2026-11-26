import type { JSONContent } from '@tiptap/core';
import type { Token, Tokens } from 'marked';

import { ANSWER, ANSWER_BLOCKS, CARD, QUESTION } from '../card-parts';
import { BLOCKS_WITH_AN_ID, HEADING_LEVELS } from '../doc-kit';
import {
  type CardToken,
  type MarkdownBlock,
  withCards,
} from './cards-in-markdown';
import { inlineFromMarkdown } from './inline-from-markdown';
import { asMarkedTokens, lexBlocks, lexInline } from './lexer';

type MarkdownToDocOptions = { newId: () => string };

const NEWLINES_BETWEEN_BLOCKS = 2;
const DEEPEST_HEADING = Math.max(...HEADING_LEVELS);

export function markdownToDoc(
  markdown: string,
  { newId }: MarkdownToDocOptions,
): JSONContent {
  const content = blocksOf(withCards(lexBlocks(markdown)));
  return withBlockIds({ type: 'doc', content: orAnEmptyLine(content) }, newId);
}

function blocksOf(tokens: MarkdownBlock[]): JSONContent[] {
  const blocks: JSONContent[] = [];
  let newlinesSinceLastBlock = 0;
  for (const token of tokens) {
    const made = token.type === 'space' ? [] : blocksOfToken(token);
    if (!made.length) {
      newlinesSinceLastBlock += countNewlines(token.raw);
      continue;
    }
    if (blocks.length) {
      blocks.push(
        ...emptyLines(newlinesSinceLastBlock - NEWLINES_BETWEEN_BLOCKS),
      );
    }
    blocks.push(...made);
    newlinesSinceLastBlock = trailingNewlines(token.raw);
  }
  return blocks;
}

function blocksOfToken(token: MarkdownBlock): JSONContent[] {
  switch (token.type) {
    case 'paragraph':
    case 'text':
      return [paragraph(inlineOf(token))];
    case 'heading':
      return [heading(token)];
    case 'code':
      return [codeBlock(token)];
    case 'blockquote':
      return [
        {
          type: 'blockquote',
          content: orAnEmptyLine(
            blocksOf(withCards(asMarkedTokens(token.tokens))),
          ),
        },
      ];
    case 'list':
      return [list(token)];
    case 'hr':
      return [{ type: 'horizontalRule' }];
    case 'table':
      return tableRows(token);
    case 'html':
      return [paragraph(htmlLines(token.raw))];
    case 'def':
      return [];
    case 'card':
      return [card(token)];
    case 'br':
    case 'checkbox':
    case 'codespan':
    case 'del':
    case 'em':
    case 'escape':
    case 'image':
    case 'link':
    case 'list_item':
    case 'space':
    case 'strong':
      return [paragraph(lines(token.raw.trim()))];
  }
}

function inlineOf(token: { tokens?: Token[] }) {
  return inlineFromMarkdown(asMarkedTokens(token.tokens));
}

function heading(token: Tokens.Heading): JSONContent {
  return {
    type: 'heading',
    attrs: { level: Math.min(token.depth, DEEPEST_HEADING) },
    content: inlineOf(token),
  };
}

function codeBlock(token: Tokens.Code): JSONContent {
  return {
    type: 'codeBlock',
    attrs: { language: token.lang?.length ? token.lang : null },
    content: textOf(codeOf(token)),
  };
}

function codeOf({ text }: Tokens.Code) {
  return text.endsWith('\n') ? text.slice(0, -1) : text;
}

function textOf(code: string): JSONContent[] {
  return code ? [{ type: 'text', text: code }] : [];
}

function list(token: Tokens.List): JSONContent {
  const items = token.items.map(withAnEmptyTask);
  if (items.some((item) => item.task)) {
    return {
      type: 'taskList',
      content: items.map((item) => ({
        type: 'taskItem',
        attrs: { checked: Boolean(item.checked) },
        content: itemContent(item),
      })),
    };
  }
  const content = items.map((item) => ({
    type: 'listItem',
    content: itemContent(item),
  }));
  return token.ordered
    ? {
        type: 'orderedList',
        attrs: { start: typeof token.start === 'number' ? token.start : 1 },
        content,
      }
    : { type: 'bulletList', content };
}

function withAnEmptyTask(item: Tokens.ListItem): Tokens.ListItem {
  const [line, ...rest] = item.tokens;
  const box = /^\[([ xX])\]$/.exec(line?.raw.trim() ?? '');
  const isALine = line?.type === 'text' || line?.type === 'paragraph';
  if (item.task || !isALine || !box) return item;
  return { ...item, task: true, checked: box[1] !== ' ', tokens: rest };
}

function itemContent(item: Tokens.ListItem) {
  const blocks = blocksOf(
    withCards(
      asMarkedTokens(item.tokens).filter(({ type }) => type !== 'checkbox'),
    ),
  );
  return blocks[0]?.type === 'paragraph' ? blocks : [paragraph([]), ...blocks];
}

function tableRows(table: Tokens.Table): JSONContent[] {
  return [table.header, ...table.rows].map((cells) =>
    paragraph(
      cells.flatMap((cell, index) => [
        ...(index ? [{ type: 'text', text: ' | ' }] : []),
        ...inlineFromMarkdown(asMarkedTokens(cell.tokens)),
      ]),
    ),
  );
}

function htmlLines(raw: string): JSONContent[] {
  const html = raw.trim();
  if (/^(?:<br\s*\/?>|<!--(?:(?!-->)[\s\S])*-->)+$/i.test(html)) {
    return inlineFromMarkdown(lexInline(html));
  }
  return lines(html);
}

function lines(text: string): JSONContent[] {
  return text
    .split('\n')
    .flatMap((line, index) => [
      ...(index ? [{ type: 'hardBreak' }] : []),
      ...(line ? [{ type: 'text', text: line }] : []),
    ]);
}

function card(token: CardToken): JSONContent {
  const question = inlineFromMarkdown(lexInline(token.question)).map((node) =>
    node.type === 'hardBreak' ? { type: 'text', text: ' ' } : node,
  );
  return {
    type: CARD,
    content: [
      { type: QUESTION, content: question },
      {
        type: ANSWER,
        content: orAnEmptyLine(answerBlocks(blocksOf(token.answer))),
      },
    ],
  };
}

function answerBlocks(blocks: JSONContent[]): JSONContent[] {
  return blocks.flatMap((block) => {
    if (ANSWER_BLOCKS.includes(block.type ?? '')) return [block];
    if (block.type === 'heading') return [paragraph(block.content ?? [])];
    if (block.type === 'blockquote') return answerBlocks(block.content ?? []);
    if (block.type === CARD) {
      const [question, answer] = block.content ?? [];
      return [paragraph(question?.content ?? []), ...(answer?.content ?? [])];
    }
    return [];
  });
}

function paragraph(content: JSONContent[]): JSONContent {
  return { type: 'paragraph', content };
}

function emptyLines(count: number) {
  return Array.from({ length: Math.max(0, count) }, () => paragraph([]));
}

function orAnEmptyLine(blocks: JSONContent[]) {
  return blocks.length ? blocks : [paragraph([])];
}

function countNewlines(raw: string) {
  return raw.split('\n').length - 1;
}

function trailingNewlines(raw: string) {
  return /\n*$/.exec(raw)?.[0].length ?? 0;
}

function withBlockIds(node: JSONContent, newId: () => string): JSONContent {
  const hasAnId = BLOCKS_WITH_AN_ID.includes(node.type ?? '');
  const attrs = hasAnId ? { ...node.attrs, blockId: newId() } : node.attrs;
  return {
    ...node,
    ...(attrs ? { attrs } : {}),
    ...(node.content
      ? { content: node.content.map((child) => withBlockIds(child, newId)) }
      : {}),
  };
}
