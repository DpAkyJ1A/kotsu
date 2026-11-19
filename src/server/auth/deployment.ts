import 'server-only';

import type { Env } from '@/server/env';

export type DeploymentEnv = Pick<
  Env,
  | 'APP_URL'
  | 'TRUSTED_PROXIES'
  | 'VERCEL_ENV'
  | 'VERCEL_PROJECT_PRODUCTION_URL'
  | 'VERCEL_BRANCH_URL'
>;

export type Deployment = {
  baseURL: string | { allowedHosts: string[] };
  rpID: string;
  trustedProxies: string[];
};

const KOTSU_HOSTS = [
  'localhost:*',
  'kotsu.devazx.com',
  'usekotsu.vercel.app',
  'kotsu-*-dpakyj1as-projects.vercel.app',
];

const LOCALHOST = 'localhost';

export function deployment(env: DeploymentEnv): Deployment {
  return { ...address(env), trustedProxies: env.TRUSTED_PROXIES };
}

function address(env: DeploymentEnv) {
  if (env.APP_URL) {
    return { baseURL: env.APP_URL, rpID: new URL(env.APP_URL).hostname };
  }
  return {
    baseURL: { allowedHosts: KOTSU_HOSTS },
    rpID: kotsuRelyingPartyId(env),
  };
}

function kotsuRelyingPartyId({
  VERCEL_ENV,
  VERCEL_PROJECT_PRODUCTION_URL,
  VERCEL_BRANCH_URL,
}: DeploymentEnv) {
  if (VERCEL_ENV === 'production') {
    return VERCEL_PROJECT_PRODUCTION_URL ?? LOCALHOST;
  }
  if (VERCEL_ENV === 'preview') return VERCEL_BRANCH_URL ?? LOCALHOST;
  return LOCALHOST;
}
