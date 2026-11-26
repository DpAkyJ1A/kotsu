import type { Node } from '@tiptap/pm/model';

import type { CardStatus } from '@/lib/card-statuses';

import { CARD } from './card-parts';
import { type CardStatuses, statusOf } from './card-status';

export type CardCounts = { total: number } & Record<CardStatus, number>;

export function cardCountsOf(doc: Node, statuses: CardStatuses): CardCounts {
  const counts: CardCounts = { total: 0, new: 0, review: 0, got_it: 0 };
  doc.descendants((node) => {
    if (node.type.name !== CARD) return true;
    counts.total += 1;
    counts[statusOf(statuses, node.attrs.blockId)] += 1;
    return false;
  });
  return counts;
}
