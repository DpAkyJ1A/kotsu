const SLASH_BLOCKS = [
  { name: 'text', keywords: ['text', 'paragraph', 'plain'] },
  { name: 'heading1', keywords: ['h1', 'heading 1', 'title'] },
  { name: 'heading2', keywords: ['h2', 'heading 2', 'subheading'] },
  { name: 'heading3', keywords: ['h3', 'heading 3', 'subheading'] },
  { name: 'bulletList', keywords: ['ul', 'bulleted list'] },
  { name: 'orderedList', keywords: ['ol', 'numbered list', 'ordered list'] },
  {
    name: 'taskList',
    keywords: ['todo list', 'task list', 'checklist', 'checkbox'],
  },
  { name: 'blockquote', keywords: ['quote', 'blockquote', 'citation'] },
  { name: 'codeBlock', keywords: ['code block', 'pre', 'snippet'] },
  {
    name: 'horizontalRule',
    keywords: ['hr', 'divider', 'line', 'horizontal rule'],
  },
] as const;

export type SlashBlock = (typeof SLASH_BLOCKS)[number]['name'];

type LabelOf = (block: SlashBlock) => string;

type SlashQuery = { query: string; wasOpen: boolean; labelOf: LabelOf };

export function findSlashBlocks(query: string, labelOf: LabelOf): SlashBlock[] {
  const wanted = wordsOf(query);
  return SLASH_BLOCKS.filter(({ name, keywords }) =>
    [labelOf(name), ...keywords].some((term) => matches(wordsOf(term), wanted)),
  ).map(({ name }) => name);
}

export function isSlashMenuOpen({ query, wasOpen, labelOf }: SlashQuery) {
  if (!/\s/.test(query)) return true;
  if (/^\s/.test(query)) return false;
  return wasOpen && findSlashBlocks(query, labelOf).length > 0;
}

function wordsOf(text: string) {
  return text.trim().toLocaleLowerCase().split(/\s+/);
}

function matches(term: string[], wanted: string[]) {
  const isOneWord = wanted.length === 1;
  return (
    (isOneWord && term.join('').startsWith(wanted.join(''))) ||
    startWordsInOrder(term, wanted)
  );
}

function startWordsInOrder(term: string[], wanted: string[]): boolean {
  const [word, ...rest] = wanted;
  if (word === undefined) return true;
  const at = term.findIndex((termWord) => termWord.startsWith(word));
  return at !== -1 && startWordsInOrder(term.slice(at + 1), rest);
}
