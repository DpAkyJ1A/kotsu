import { sql } from 'drizzle-orm';
import {
  check,
  customType,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { ITEM_KINDS } from '@/lib/item-kinds';
import { PALETTE_COLORS } from '@/lib/palette-colors';

import { user } from './auth';

export const paletteColor = pgEnum('palette_color', PALETTE_COLORS);

export const itemKind = pgEnum('item_kind', ITEM_KINDS);

const orderKey = customType<{ data: string }>({
  dataType: () => 'text collate "C"',
});

const tsvector = customType<{ data: string }>({
  dataType: () => 'tsvector',
});

export const shelf = pgTable(
  'shelf',
  {
    id: uuid('id')
      .default(sql`uuidv7()`)
      .primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: paletteColor('color').notNull(),
    position: orderKey('position').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique('shelf_id_user_id_unique').on(table.id, table.userId),
    index('shelf_user_id_position_idx').on(table.userId, table.position),
    check(
      'shelf_name_length',
      sql`char_length(${table.name}) between 1 and 80`,
    ),
  ],
);

export const item = pgTable(
  'item',
  {
    id: uuid('id')
      .default(sql`uuidv7()`)
      .primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    shelfId: uuid('shelf_id').notNull(),
    kind: itemKind('kind').notNull(),
    title: text('title').notNull(),
    position: orderKey('position').notNull(),
    content: jsonb('content'),
    plainText: text('plain_text').notNull().default(''),
    search: tsvector('search').generatedAlwaysAs(
      sql`setweight(to_tsvector('simple', "title"), 'A') || setweight(to_tsvector('simple', "plain_text"), 'B')`,
    ),
    version: integer('version').notNull().default(1),
    sizeBytes: integer('size_bytes').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique('item_id_user_id_unique').on(table.id, table.userId),
    foreignKey({
      name: 'item_shelf_id_user_id_fkey',
      columns: [table.shelfId, table.userId],
      foreignColumns: [shelf.id, shelf.userId],
    }).onDelete('cascade'),
    index('item_user_id_shelf_id_position_idx').on(
      table.userId,
      table.shelfId,
      table.position,
    ),
    index('item_search_idx').using('gin', table.search),
    index('item_title_trgm_idx').using('gin', table.title.op('gin_trgm_ops')),
    check(
      'item_title_length',
      sql`char_length(${table.title}) between 1 and 200`,
    ),
  ],
);
