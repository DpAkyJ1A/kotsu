import type { JSONContent } from '@tiptap/core';
import { z } from 'zod';

import { DocBody } from './doc-body';

export type Doc = {
  id: string;
  content: JSONContent | null;
  version: number;
};

export type SavedDoc = { version: number };

export const GetDocInput = z.strictObject({ id: z.uuid() });

export const SaveDocInput = z.strictObject({
  id: z.uuid(),
  version: z.int32().positive(),
  content: DocBody,
});

export type DocSave = z.input<typeof SaveDocInput>;
