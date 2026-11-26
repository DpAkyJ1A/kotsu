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

const APPLE_MODIFIERS: Partial<Record<string, string>> = {
  Mod: '⌘',
  Alt: '⌥',
  Shift: '⇧',
  Enter: '↵',
};

const OTHER_MODIFIERS: Partial<Record<string, string>> = {
  Mod: 'Ctrl',
  Alt: 'Alt',
  Shift: 'Shift',
  Enter: 'Enter',
};

export function shortcutKeys(
  binding: string,
  { isApple }: { isApple: boolean },
) {
  const modifiers = isApple ? APPLE_MODIFIERS : OTHER_MODIFIERS;
  return binding
    .split('-')
    .map((key) => modifiers[key] ?? key.toUpperCase())
    .join(isApple ? '' : ' ');
}
