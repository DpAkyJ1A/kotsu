import { z } from 'zod';

import { PALETTE_COLORS, type PaletteColor } from '@/lib/palette-colors';

export type Shelf = {
  id: string;
  name: string;
  color: PaletteColor;
};

const ShelfId = z.uuid();
const ShelfName = z.string().trim().min(1).max(80);
const ShelfColor = z.enum(PALETTE_COLORS);

export const CreateShelfInput = z.strictObject({
  name: ShelfName,
  color: ShelfColor.optional(),
});

export const UpdateShelfInput = z
  .strictObject({
    id: ShelfId,
    name: ShelfName.optional(),
    color: ShelfColor.optional(),
  })
  .refine(({ name, color }) => name !== undefined || color !== undefined);

export const MoveShelfInput = z
  .strictObject({
    id: ShelfId,
    after: ShelfId.optional(),
  })
  .refine(({ id, after }) => id !== after);

export const DeleteShelfInput = z.strictObject({ id: ShelfId });
