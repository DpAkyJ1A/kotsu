import type { Node } from '@tiptap/pm/model';

const LEAF = ' ';

export type OutlineHeading = {
  blockId: string;
  text: string;
  depth: number;
  position: number;
};

export type HeadingTop = { blockId: string; top: number };

type FoundHeading = Omit<OutlineHeading, 'depth'> & { level: number };

export function outlineOf(doc: Node): OutlineHeading[] {
  const headings = headingsIn(doc);
  if (headings.length === 0) return [];
  const topLevel = Math.min(...headings.map(({ level }) => level));
  return headings.map(({ level, ...heading }) => ({
    ...heading,
    depth: level - topLevel,
  }));
}

export function currentHeadingOf(
  tops: readonly HeadingTop[],
  readingLine: number,
) {
  return tops.findLast(({ top }) => Math.floor(top) <= readingLine)?.blockId;
}

function headingsIn(doc: Node) {
  const found: FoundHeading[] = [];
  doc.descendants((node, position) => {
    if (node.type.name !== 'heading') return !node.isTextblock;
    const text = node.textBetween(0, node.content.size, undefined, LEAF).trim();
    const { blockId, level } = node.attrs;
    if (text !== '' && typeof blockId === 'string') {
      found.push({ blockId, text, level: Number(level), position });
    }
    return false;
  });
  return found;
}
