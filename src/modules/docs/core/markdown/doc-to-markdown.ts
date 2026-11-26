import type { JSONContent } from '@tiptap/core';

import { CARD } from '../card-parts';
import { inlineToMarkdown } from './inline-to-markdown';

const EMPTY_LINE = '<!-- -->';

const LISTS_MARKED_WITH_A_BULLET = ['bulletList', 'taskList'];

type ListMarkers = { bullet: '-' | '*'; number: '.' | ')' };

const FIRST_MARKERS: ListMarkers = { bullet: '-', number: '.' };

export function docToMarkdown(doc: JSONContent): string {
  const markdown = blocksToMarkdown(doc.content ?? []);
  return markdown ? `${markdown}\n` : '';
}

function blocksToMarkdown(blocks: JSONContent[]) {
  let markdown = '';
  let emptyLines = 0;
  let previous: JSONContent | null = null;
  let markers = FIRST_MARKERS;
  for (const block of blocks) {
    if (isEmptyParagraph(block)) {
      emptyLines += previous ? 1 : 0;
      continue;
    }
    markers = markersAfter(previous, block, markers);
    const written = blockToMarkdown(block, markers);
    markdown += previous ? `\n\n${'\n'.repeat(emptyLines)}${written}` : written;
    previous = block;
    emptyLines = 0;
  }
  return markdown;
}

function isEmptyParagraph(block: JSONContent) {
  return block.type === 'paragraph' && !block.content?.length;
}

function markersAfter(
  previous: JSONContent | null,
  block: JSONContent,
  markers: ListMarkers,
): ListMarkers {
  if (bothMarkedWithABullet(previous, block)) {
    return { ...markers, bullet: markers.bullet === '-' ? '*' : '-' };
  }
  if (previous?.type === 'orderedList' && block.type === 'orderedList') {
    return { ...markers, number: markers.number === '.' ? ')' : '.' };
  }
  return FIRST_MARKERS;
}

function bothMarkedWithABullet(
  previous: JSONContent | null,
  block: JSONContent,
) {
  return [previous?.type, block.type].every(
    (type) => type !== undefined && LISTS_MARKED_WITH_A_BULLET.includes(type),
  );
}

function blockToMarkdown(block: JSONContent, markers: ListMarkers): string {
  const children = block.content ?? [];
  switch (block.type ?? '') {
    case 'paragraph':
      return inlineToMarkdown(children);
    case 'heading':
      return headingToMarkdown(block);
    case 'blockquote':
      return withLinePrefix(blocksToMarkdown(children), '> ');
    case 'bulletList':
      return listToMarkdown(children, () => `${markers.bullet} `);
    case 'taskList':
      return listToMarkdown(
        children,
        (item) => `${markers.bullet} [${item.attrs?.checked ? 'x' : ' '}] `,
      );
    case 'orderedList':
      return listToMarkdown(
        children,
        (_, index) => `${String(numberOf(block) + index)}${markers.number} `,
      );
    case 'codeBlock':
      return codeBlockToMarkdown(block);
    case 'horizontalRule':
      return '---';
    case CARD:
      return cardToMarkdown(block);
    default:
      throw new Error(`No Markdown for a ${block.type ?? 'nameless'} block`);
  }
}

function headingToMarkdown(heading: JSONContent) {
  const hashes = '#'.repeat(Number(heading.attrs?.level ?? 1));
  const text = inlineToMarkdown(heading.content ?? []);
  return text ? `${hashes} ${text}` : hashes;
}

function numberOf(list: JSONContent) {
  return Number(list.attrs?.start ?? 1);
}

function listToMarkdown(
  items: JSONContent[],
  markerOf: (item: JSONContent, index: number) => string,
) {
  return items
    .map((item, index) => itemToMarkdown(item, markerOf(item, index)))
    .join('\n');
}

function itemToMarkdown(item: JSONContent, marker: string) {
  const [line, ...blocks] = item.content ?? [];
  const indent = ' '.repeat(marker.indexOf(' ') + 1);
  const text = inlineToMarkdown(line?.content ?? []);
  const more = withLinePrefix(blocksToMarkdown(blocks), indent);
  if (!more) return text ? `${marker}${text}` : marker.trimEnd();
  const emptyLines = '\n'.repeat(leadingEmptyParagraphs(blocks));
  return `${marker}${text || EMPTY_LINE}\n\n${emptyLines}${more}`;
}

function leadingEmptyParagraphs(blocks: JSONContent[]) {
  const firstWithText = blocks.findIndex((block) => !isEmptyParagraph(block));
  return firstWithText === -1 ? 0 : firstWithText;
}

function codeBlockToMarkdown(block: JSONContent) {
  const code = block.content?.map(({ text }) => text ?? '').join('') ?? '';
  const language: unknown = block.attrs?.language;
  const info = typeof language === 'string' ? language : '';
  const fenceChar = info.includes('`') ? '~' : '`';
  const longestRun = Math.max(
    2,
    ...(code.match(fenceChar === '`' ? /`+/g : /~+/g) ?? []).map(
      (run) => run.length,
    ),
  );
  const fence = fenceChar.repeat(longestRun + 1);
  return code
    ? `${fence}${info}\n${code}\n${fence}`
    : `${fence}${info}\n${fence}`;
}

function cardToMarkdown(card: JSONContent) {
  const [question, answer] = card.content ?? [];
  const summary = `<details>\n<summary>${inlineToMarkdown(question?.content ?? [])}</summary>`;
  const answerMarkdown = blocksToMarkdown(answer?.content ?? []);
  return answerMarkdown
    ? `${summary}\n\n${answerMarkdown}\n\n</details>`
    : `${summary}\n\n</details>`;
}

function withLinePrefix(markdown: string, prefix: string) {
  return markdown
    .split('\n')
    .map((line) => (line ? `${prefix}${line}` : prefix.trimEnd()))
    .join('\n');
}
