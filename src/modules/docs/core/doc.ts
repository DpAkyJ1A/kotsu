import type { JSONContent } from '@tiptap/core';
import { z } from 'zod';

export type Doc = {
  id: string;
  content: JSONContent | null;
  version: number;
};

export const GetDocInput = z.strictObject({ id: z.uuid() });
