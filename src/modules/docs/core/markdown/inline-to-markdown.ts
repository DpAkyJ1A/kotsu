import type { JSONContent } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';

import { DOC_SCHEMA } from '../doc-schema';
import { codeSpan, escapedText, withSafeEdges } from './escape-markdown';
import { canClose, canOpen } from './flanking';
import { inlineFromMarkdown } from './inline-from-markdown';
import { lexInline } from './lexer';

type Mark = NonNullable<JSONContent['marks']>[number];

type Piece =
  | { kind: 'content'; markdown: string }
  | { kind: 'open' | 'close'; mark: Mark };

const WRAPPING_MARKS = ['textStyle', 'bold', 'italic', 'strike'];

const DELIMITERS: Record<string, string> = {
  bold: '**',
  italic: '_',
  strike: '~~',
};

const TAGS: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  strike: 's',
};

const LINE_EDGE = ' ';
const TAG_OR_DELIMITER = '*';

export function inlineToMarkdown(nodes: JSONContent[]): string {
  const line = lineOf(nodes);
  const pieces = piecesOf((line.toJSON() as JSONContent).content ?? []);
  const withDelimiters = written(pieces, pairsWrittenAsDelimiters(pieces));
  const markdown = readsBackAs(withDelimiters, line)
    ? withDelimiters
    : written(pieces, new Set());
  return withSafeEdges(markdown);
}

function lineOf(nodes: JSONContent[]) {
  return DOC_SCHEMA.nodeFromJSON({ type: 'paragraph', content: nodes });
}

function readsBackAs(markdown: string, line: Node) {
  return lineOf(inlineFromMarkdown(lexInline(markdown))).eq(line);
}

function piecesOf(nodes: JSONContent[]): Piece[] {
  const pieces: Piece[] = [];
  let open: Mark[] = [];
  for (const node of nodes) {
    const marks = (node.marks ?? []).filter(isWrapping);
    const kept = sharedStart(open, marks);
    pieces.push(
      ...open.slice(kept).reverse().map(closing),
      ...marks.slice(kept).map(opening),
      { kind: 'content', markdown: contentOf(node) },
    );
    open = marks;
  }
  pieces.push(...[...open].reverse().map(closing));
  return pieces;
}

function isWrapping(mark: Mark) {
  if (!WRAPPING_MARKS.includes(mark.type)) return false;
  return (
    mark.type !== 'textStyle' ||
    Boolean(mark.attrs?.color) ||
    Boolean(mark.attrs?.backgroundColor)
  );
}

function sharedStart(open: Mark[], marks: Mark[]) {
  let index = 0;
  while (
    index < open.length &&
    index < marks.length &&
    isSameMark(open[index], marks[index])
  ) {
    index += 1;
  }
  return index;
}

function isSameMark(a: Mark | undefined, b: Mark | undefined) {
  return (
    a?.type === b?.type &&
    a?.attrs?.color === b?.attrs?.color &&
    a?.attrs?.backgroundColor === b?.attrs?.backgroundColor
  );
}

function opening(mark: Mark): Piece {
  return { kind: 'open', mark };
}

function closing(mark: Mark): Piece {
  return { kind: 'close', mark };
}

function contentOf(node: JSONContent) {
  if (node.type === 'hardBreak') return '<br>';
  const text = node.text ?? '';
  const isCode = node.marks?.some((mark) => mark.type === 'code') ?? false;
  return isCode ? codeSpan(text) : escapedText(text);
}

function pairsWrittenAsDelimiters(pieces: Piece[]) {
  const asDelimiters = new Set<number>();
  const openings: number[] = [];
  pieces.forEach((piece, index) => {
    if (piece.kind === 'open') openings.push(index);
    if (piece.kind !== 'close') return;
    const start = openings.pop() ?? index;
    const delimiter = DELIMITERS[piece.mark.type];
    if (
      delimiter &&
      canOpen(delimiter, charBefore(pieces, start), charAfter(pieces, start)) &&
      canClose(delimiter, charBefore(pieces, index), charAfter(pieces, index))
    ) {
      asDelimiters.add(start).add(index);
    }
  });
  return asDelimiters;
}

function charBefore(pieces: Piece[], index: number) {
  const piece = pieces[index - 1];
  if (!piece) return LINE_EDGE;
  return piece.kind === 'content' ? piece.markdown.slice(-1) : TAG_OR_DELIMITER;
}

function charAfter(pieces: Piece[], index: number) {
  const piece = pieces[index + 1];
  if (!piece) return LINE_EDGE;
  return piece.kind === 'content' ? piece.markdown.charAt(0) : TAG_OR_DELIMITER;
}

function written(pieces: Piece[], asDelimiters: Set<number>) {
  return pieces
    .map((piece, index) => writtenPiece(piece, asDelimiters.has(index)))
    .join('');
}

function writtenPiece(piece: Piece, asDelimiter: boolean) {
  if (piece.kind === 'content') return piece.markdown;
  const { mark, kind } = piece;
  if (asDelimiter) return DELIMITERS[mark.type] ?? '';
  if (mark.type === 'textStyle') {
    return kind === 'open' ? colourTag(mark) : '</span>';
  }
  const tag = TAGS[mark.type] ?? '';
  return kind === 'open' ? `<${tag}>` : `</${tag}>`;
}

function colourTag({ attrs }: Mark) {
  const color: unknown = attrs?.color;
  const background: unknown = attrs?.backgroundColor;
  const text = typeof color === 'string' ? ` data-color="${color}"` : '';
  const marker =
    typeof background === 'string' ? ` data-bg="${background}"` : '';
  return `<span${text}${marker}>`;
}
