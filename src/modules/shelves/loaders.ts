import 'server-only';

import { notFound } from 'next/navigation';
import { cache } from 'react';

import { getCtx } from '@/server/ctx/get-ctx';
import { AppError } from '@/server/domain';

import { getNavigation, getShelf, getStorage } from './domain/queries';

export const loadNavigation = cache(async () => getNavigation(await getCtx()));

export const loadShelf = cache(async (id: string) => {
  const ctx = await getCtx();
  try {
    return await getShelf(ctx, { id });
  } catch (error) {
    if (isMissing(error)) notFound();
    throw error;
  }
});

export const loadStorage = cache(async () => getStorage(await getCtx()));

function isMissing(error: unknown) {
  return (
    error instanceof AppError &&
    (error.code === 'NOT_FOUND' || error.code === 'VALIDATION')
  );
}
