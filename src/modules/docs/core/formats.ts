import type { SlashBlock } from './slash-blocks';

const MARKS = ['bold', 'italic', 'strike', 'code'] as const;

export type Mark = (typeof MARKS)[number];

export type Format = Exclude<SlashBlock, 'text'> | Mark;

const INSERTS = ['horizontalRule', 'card'] as const;

type Insert = (typeof INSERTS)[number];

export type Toggle = Exclude<Format, Insert>;

type Shortcut = { keys?: string; markdown?: string };

export const SHORTCUTS: Record<Format, Shortcut> & {
  lastColour: { keys: string };
  card: { keys: string; markdown: string };
} = {
  heading1: { keys: 'Mod-Alt-1', markdown: '#' },
  heading2: { keys: 'Mod-Alt-2', markdown: '##' },
  heading3: { keys: 'Mod-Alt-3', markdown: '###' },
  bold: { keys: 'Mod-b', markdown: '**' },
  italic: { keys: 'Mod-i', markdown: '*' },
  strike: { keys: 'Mod-Shift-s', markdown: '~~' },
  code: { keys: 'Mod-e', markdown: '`' },
  bulletList: { keys: 'Mod-Shift-8', markdown: '-' },
  orderedList: { keys: 'Mod-Shift-7', markdown: '1.' },
  taskList: { keys: 'Mod-Shift-9', markdown: '[]' },
  blockquote: { keys: 'Mod-Shift-b', markdown: '>' },
  codeBlock: { keys: 'Mod-Alt-c', markdown: '```' },
  horizontalRule: { markdown: '---' },
  card: { keys: 'Mod-Shift-Enter', markdown: '??' },
  lastColour: { keys: 'Mod-Shift-h' },
};

export function isMark(format: Format): format is Mark {
  return MARKS.some((mark) => mark === format);
}

export function isToggle(format: Format): format is Toggle {
  return !INSERTS.some((insert) => insert === format);
}

export function markdownOf(format: Format, text: string) {
  const { markdown } = SHORTCUTS[format];
  if (markdown === undefined) return null;
  return isMark(format) ? `${markdown}${text}${markdown}` : markdown;
}
