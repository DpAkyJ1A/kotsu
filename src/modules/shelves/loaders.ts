import 'server-only';

import { cache } from 'react';

import { getCtx } from '@/server/ctx/get-ctx';

import { getNavigation } from './domain/queries';

export const loadNavigation = cache(async () => getNavigation(await getCtx()));
