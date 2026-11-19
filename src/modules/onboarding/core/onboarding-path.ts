import type { Route } from 'next';

import { HOME_PATH } from '@/lib/sign-in-path';

export function onboardingPath(next: string | null): Route {
  if (!next || next === HOME_PATH) return '/onboarding';
  return `/onboarding?${new URLSearchParams({ next })}`;
}
