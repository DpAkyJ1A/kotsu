import 'server-only';

import { cache } from 'react';

import { getCtx } from '@/server/ctx/get-ctx';

import { listShelves } from './domain/queries';

export const loadShelves = cache(async () => listShelves(await getCtx()));
