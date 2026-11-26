const SPACE_ENTITIES: Record<string, string> = { ' ': '&#32;', '\t': '&#9;' };

export function escapedText(text: string) {
  return text
    .replace(/[\\*_`~[]/g, '\\$&')
    .replace(/&(?=#?\w+;)/g, '\\&')
    .replace(/<(?=[A-Za-z/!?])/g, '&lt;');
}

export function codeSpan(text: string) {
  const longestRun = Math.max(
    0,
    ...(text.match(/`+/g) ?? []).map((run) => run.length),
  );
  const fence = '`'.repeat(longestRun + 1);
  const needsPadding =
    text.startsWith('`') || text.endsWith('`') || /^ .*[^ ].* $/s.test(text);
  const padding = needsPadding ? ' ' : '';
  return `${fence}${padding}${text}${padding}${fence}`;
}

export function withSafeEdges(markdown: string) {
  return markdown
    .replace(/^[ \t]/, (space) => SPACE_ENTITIES[space] ?? space)
    .replace(/[ \t]$/, (space) => SPACE_ENTITIES[space] ?? space)
    .replace(/^[#>+-]/, '\\$&')
    .replace(/^(\d+)([.)])/, '$1\\$2')
    .replace(/(?<!\\)#$/, '\\#');
}
