import 'server-only';

import { notFound } from 'next/navigation';
import { cache } from 'react';

import { getCtx } from '@/server/ctx/get-ctx';
import { AppError } from '@/server/domain';

import { getDoc } from './domain/queries';

export const loadDoc = cache(async (id: string) => {
  const ctx = await getCtx();
  try {
    return await getDoc(ctx, { id });
  } catch (error) {
    if (isMissing(error)) notFound();
    throw error;
  }
});

function isMissing(error: unknown) {
  return (
    error instanceof AppError &&
    (error.code === 'NOT_FOUND' || error.code === 'VALIDATION')
  );
}
