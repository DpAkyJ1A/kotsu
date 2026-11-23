import { getSchema, type JSONContent } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { z } from 'zod';

import { DocKit, HEADING_LEVELS } from './doc-kit';

const schema = getSchema([DocKit]);

const ORDERED_LIST_STYLES = ['1', 'a', 'A', 'i', 'I'];

const ATTRIBUTE_VALUES: Record<string, z.ZodType> = {
  blockId: z.uuid().nullable(),
  level: z.literal(HEADING_LEVELS),
  checked: z.boolean(),
  start: z.int().nonnegative(),
  type: z.enum(ORDERED_LIST_STYLES).nullable(),
  language: z.string().nullable(),
};

export const DocBody = z
  .custom<JSONContent>((value) => typeof value === 'object' && value !== null)
  .transform((json, ctx) => {
    const body = storedBodyOf(json);
    if (body === null) {
      ctx.issues.push({
        code: 'custom',
        message: 'Not a doc this editor can hold',
        input: json,
      });
      return z.NEVER;
    }
    return body;
  });

function storedBodyOf(json: JSONContent): JSONContent | null {
  const doc = parsed(json);
  if (doc?.type.name !== 'doc' || !hasValidAttributes(doc)) return null;
  return doc.toJSON() as JSONContent;
}

function parsed(json: JSONContent) {
  try {
    const doc = Node.fromJSON(schema, json);
    doc.check();
    return doc;
  } catch {
    return null;
  }
}

function hasValidAttributes(doc: Node) {
  let isValid = true;
  doc.descendants((node) => {
    isValid &&= Object.entries(node.attrs).every(
      ([name, value]) => ATTRIBUTE_VALUES[name]?.safeParse(value).success,
    );
    return isValid;
  });
  return isValid;
}
