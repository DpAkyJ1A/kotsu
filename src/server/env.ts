import 'server-only';

import { z } from 'zod';

const Env = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

const parsed = Env.safeParse(process.env);

if (!parsed.success) {
  // Names and rules only: the values may be secrets
  throw new Error(
    `Invalid environment variables, see .env.example:\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
