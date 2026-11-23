import 'server-only';

import { z } from 'zod';

const IpOrRange = z.union([z.ipv4(), z.ipv6(), z.cidrv4(), z.cidrv6()]);

const Env = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  BETTER_AUTH_SECRET: z.string().min(32),
  APP_URL: z
    .url({ protocol: /^https?$/ })
    .transform((url) => new URL(url).origin)
    .optional(),
  TRUSTED_PROXIES: z
    .string()
    .default('')
    .transform((list) =>
      list
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    )
    .pipe(z.array(IpOrRange)),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Kotsu <no-reply@kotsu.devazx.com>'),
  SIGN_IN_CODES_IN_LOG: z.stringbool().default(false),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STORAGE_QUOTA_MB: z.coerce.number().int().positive().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
  VERCEL_BRANCH_URL: z.string().optional(),
});

export type Env = z.infer<typeof Env>;

const parsed = Env.safeParse(withoutEmptyValues(process.env));

if (!parsed.success) {
  // Names and rules only: the values may be secrets
  throw new Error(
    `Invalid environment variables, see .env.example:\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;

function withoutEmptyValues(variables: NodeJS.ProcessEnv) {
  return Object.fromEntries(
    Object.entries(variables).filter(([, value]) => value !== ''),
  );
}
