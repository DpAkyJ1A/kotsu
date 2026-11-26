export const CARD_STATUSES = ['new', 'review', 'got_it'] as const;

export type CardStatus = (typeof CARD_STATUSES)[number];
