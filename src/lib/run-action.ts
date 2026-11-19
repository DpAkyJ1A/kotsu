export type Action<Input, Code extends string> = (
  input: Input,
) => Promise<{ ok: true } | { ok: false; error: { code: Code } }>;

export type ActionFailure<Code extends string> = Code | 'OFFLINE' | 'INTERNAL';

export async function runAction<Input, Code extends string>(
  action: Action<Input, Code>,
  input: Input,
): Promise<ActionFailure<Code> | null> {
  if (isOffline()) return 'OFFLINE';
  try {
    const result = await action(input);
    return result.ok ? null : result.error.code;
  } catch {
    return isOffline() ? 'OFFLINE' : 'INTERNAL';
  }
}

function isOffline() {
  return !navigator.onLine;
}
