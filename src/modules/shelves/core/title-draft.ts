const LINE_BREAKS = /\s*[\r\n]+\s*/g;

export function oneLine(draft: string) {
  return draft.replace(LINE_BREAKS, ' ');
}

export function titleToSave(draft: string, saved: string) {
  const title = draft.trim();
  return title === '' || title === saved ? null : title;
}
