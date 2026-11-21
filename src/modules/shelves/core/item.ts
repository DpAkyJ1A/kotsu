import { z } from 'zod';

import { ITEM_KINDS, type ItemKind } from '@/lib/item-kinds';

export type Item = {
  id: string;
  shelfId: string;
  kind: ItemKind;
  title: string;
};

export const ITEM_TITLE_MAX_LENGTH = 200;

const ItemId = z.uuid();
const ShelfId = z.uuid();
const ItemTitle = z.string().trim().min(1).max(ITEM_TITLE_MAX_LENGTH);

export const CreateItemInput = z.strictObject({
  id: z.uuidv7().optional(),
  shelfId: ShelfId,
  kind: z.enum(ITEM_KINDS),
  title: ItemTitle,
});

export const RenameItemInput = z.strictObject({
  id: ItemId,
  title: ItemTitle,
});

export const MoveItemInput = z
  .strictObject({
    id: ItemId,
    shelfId: ShelfId,
    after: ItemId.optional(),
  })
  .refine(({ id, after }) => id !== after);

export const DeleteItemInput = z.strictObject({ id: ItemId });
