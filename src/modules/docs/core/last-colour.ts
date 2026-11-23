import { z } from 'zod';

import { type Colour, type ColourRow, COLOURS } from './colours';

const LastColour = z
  .object({
    text: z.enum(COLOURS).optional(),
    background: z.enum(COLOURS).optional(),
  })
  .refine(({ text, background }) => text ?? background);

export type LastColour = z.infer<typeof LastColour>;

export const FIRST_LAST_COLOUR: LastColour = { text: 'red' };

export function lastColourOf(stored: string | null): LastColour {
  const result = LastColour.safeParse(jsonOf(stored));
  return result.success ? result.data : FIRST_LAST_COLOUR;
}

export function withPick(
  picked: LastColour,
  { row, colour }: { row: ColourRow; colour: Colour },
): LastColour {
  return row === 'text'
    ? { ...picked, text: colour }
    : { ...picked, background: colour };
}

function jsonOf(stored: string | null): unknown {
  if (stored === null) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
