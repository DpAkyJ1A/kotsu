import { sql } from 'drizzle-orm';
import {
  check,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { user } from './auth';

export const theme = pgEnum('theme', ['light', 'dark', 'system']);
export const locale = pgEnum('locale', ['en', 'ru']);
export const weekStart = pgEnum('week_start', ['monday', 'sunday']);
export const timeFormat = pgEnum('time_format', ['h24', 'h12']);

export const userSettings = pgTable(
  'user_settings',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    theme: theme('theme').default('system').notNull(),
    locale: locale('locale').default('en').notNull(),
    timezone: text('timezone').default('UTC').notNull(),
    dayEndsAt: time('day_ends_at').default('04:00').notNull(),
    weekStart: weekStart('week_start').default('monday').notNull(),
    timeFormat: timeFormat('time_format').default('h24').notNull(),
    onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check(
      'user_settings_timezone_length',
      sql`char_length(${table.timezone}) between 1 and 64`,
    ),
    check(
      'user_settings_day_ends_at_range',
      sql`${table.dayEndsAt} between '00:00' and '06:00'`,
    ),
  ],
);
