import { sql } from 'drizzle-orm';
import {
  check,
  customType,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { PALETTE_COLORS } from '@/lib/palette-colors';

import { user } from './auth';

export const paletteColor = pgEnum('palette_color', PALETTE_COLORS);

const orderKey = customType<{ data: string }>({
  dataType: () => 'text collate "C"',
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
