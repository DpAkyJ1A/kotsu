import 'server-only';

import type { z } from 'zod';

import type { Ctx } from './ctx/load-ctx';

export type AppErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'INTERNAL';

export class AppError extends Error {
  override readonly name = 'AppError';

  constructor(
    readonly code: AppErrorCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
  }
}

export function query<Input extends z.ZodType, Result>(
  schema: Input,
  run: (ctx: Ctx, input: z.output<Input>) => Promise<Result>,
) {
  return async (ctx: Ctx, input: z.input<Input>) =>
    run(ctx, parse(schema, input));
}

export function command<Input extends z.ZodType, Result>(
  schema: Input,
  run: (ctx: Ctx, input: z.output<Input>) => Promise<Result>,
) {
  return async (ctx: Ctx, input: z.input<Input>) =>
    run(ctx, parse(schema, input));
}

command.tx = function transaction<Input extends z.ZodType, Result>(
  schema: Input,
  run: (ctx: Ctx, input: z.output<Input>) => Promise<Result>,
) {
  return command(schema, (ctx, input) =>
    ctx.db.transaction((db) => run({ ...ctx, db }, input)),
  );
};

function parse<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.output<Schema> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION', { cause: parsed.error });
  }
  return parsed.data;
}
