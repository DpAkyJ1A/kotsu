import { sql } from 'drizzle-orm';
import {
  customType,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { CARD_STATUSES } from '@/lib/card-statuses';

import { user } from './auth';
import { item } from './shelves';

export const cardStatus = pgEnum('card_status', CARD_STATUSES);

const tsvector = customType<{ data: string }>({
  dataType: () => 'tsvector',
});

export const card = pgTable(
  'card',
  {
    id: uuid('id')
      .default(sql`uuidv7()`)
      .primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').notNull(),
    blockId: uuid('block_id').notNull(),
    position: integer('position').notNull(),
    front: text('front').notNull(),
    back: text('back').notNull(),
    status: cardStatus('status').notNull().default('new'),
    removedAt: timestamp('removed_at', { withTimezone: true }),
    search: tsvector('search').generatedAlwaysAs(
      sql`setweight(to_tsvector('simple', "front"), 'A') || setweight(to_tsvector('simple', "back"), 'B')`,
    ),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique('card_id_user_id_unique').on(table.id, table.userId),
    unique('card_item_id_block_id_unique').on(table.itemId, table.blockId),
    foreignKey({
      name: 'card_item_id_user_id_fkey',
      columns: [table.itemId, table.userId],
      foreignColumns: [item.id, item.userId],
    }).onDelete('cascade'),
    index('card_user_id_item_id_live_idx')
      .on(table.userId, table.itemId)
      .where(sql`${table.removedAt} is null`),
    index('card_search_idx').using('gin', table.search),
  ],
);
