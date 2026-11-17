type KeyPress = Pick<
  KeyboardEvent,
  | 'metaKey'
  | 'ctrlKey'
  | 'altKey'
  | 'shiftKey'
  | 'code'
  | 'repeat'
  | 'defaultPrevented'
>;

export function isShortcut(event: KeyPress, code: string) {
  return (
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.code === code &&
    !event.repeat &&
    !event.defaultPrevented
  );
}

export function isApplePlatform(userAgent: string) {
  return /Mac|iPhone|iPad/.test(userAgent);
}
