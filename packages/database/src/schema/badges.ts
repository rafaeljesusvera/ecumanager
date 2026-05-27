import { sql } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { clubs, profiles } from './clubs';
import { riders } from './riders';

export const badges = pgTable(
  'badges',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    subtitle: text('subtitle'),
    categoryLabel: text('category_label'),
    description: text('description'),
    iconUrl: text('icon_url'),
    color: text('color').notNull().default('#3f8649'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniqCode: uniqueIndex('badges_club_code_unique').on(t.clubId, t.code),
  }),
);

export const riderBadges = pgTable(
  'rider_badges',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    riderId: uuid('rider_id')
      .notNull()
      .references(() => riders.id, { onDelete: 'cascade' }),
    badgeId: uuid('badge_id')
      .notNull()
      .references(() => badges.id, { onDelete: 'cascade' }),
    awardedAt: timestamp('awarded_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    awardedBy: uuid('awarded_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
  },
  (t) => ({
    uniq: uniqueIndex('rider_badges_rider_badge_unique').on(
      t.riderId,
      t.badgeId,
    ),
    byRider: index('rider_badges_rider_idx').on(t.riderId),
  }),
);
