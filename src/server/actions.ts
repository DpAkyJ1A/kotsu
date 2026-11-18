import 'server-only';

import { refresh } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';

import { getCtx } from './ctx/get-ctx';
import type { Ctx } from './ctx/load-ctx';
import { AppError, type AppErrorCode } from './domain';

export type ActionResult<Result> =
  { ok: true; data: Result } | { ok: false; error: { code: AppErrorCode } };

export function defineAction<Input, Result>(
  run: (ctx: Ctx, input: Input) => Promise<Result>,
) {
  return async (input: Input): Promise<ActionResult<Result>> => {
    const ctx = await getCtx();
    try {
      const data = await run(ctx, input);
      refresh();
      return { ok: true, data };
    } catch (error) {
      unstable_rethrow(error);
      return { ok: false, error: { code: codeOf(error) } };
    }
  };
}

function codeOf(error: unknown): AppErrorCode {
  if (error instanceof AppError) return error.code;
  console.error(error);
  return 'INTERNAL';
}
