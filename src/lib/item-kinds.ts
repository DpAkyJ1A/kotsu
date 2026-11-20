export const ITEM_KINDS = ['doc', 'sheet'] as const;

export type ItemKind = (typeof ITEM_KINDS)[number];
