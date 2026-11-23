import 'server-only';

import { refresh } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';

import { getCtx } from './ctx/get-ctx';
import type { Ctx } from './ctx/load-ctx';
import { AppError, type AppErrorCode } from './domain';

export type ActionResult<Result> =
  { ok: true; data: Result } | { ok: false; error: { code: AppErrorCode } };

type Run<Input, Result> = (ctx: Ctx, input: Input) => Promise<Result>;

export function defineAction<Input, Result>(run: Run<Input, Result>) {
  return async (input: Input): Promise<ActionResult<Result>> => {
    const result = await answer(run, input);
    if (result.ok) refresh();
    return result;
  };
}

export async function answer<Input, Result>(
  run: Run<Input, Result>,
  input: Input,
): Promise<ActionResult<Result>> {
  const ctx = await getCtx();
  try {
    return { ok: true, data: await run(ctx, input) };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: { code: codeOf(error) } };
  }
}

function codeOf(error: unknown): AppErrorCode {
  if (error instanceof AppError) return error.code;
  console.error(error);
  return 'INTERNAL';
}
