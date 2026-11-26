export type CardStatus = 'new' | 'review' | 'got_it';

export type CardStatuses = Readonly<Partial<Record<string, CardStatus>>>;

export function statusOf(statuses: CardStatuses, blockId: unknown) {
  return typeof blockId === 'string' ? (statuses[blockId] ?? 'new') : 'new';
}
