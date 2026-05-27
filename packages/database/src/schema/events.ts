import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { EVENT_KINDS, EVENT_STATUSES } from '@equmanager/domain';

import { clubs, profiles } from './clubs';

export const eventKindEnum = pgEnum('event_kind', EVENT_KINDS);
export const eventStatusEnum = pgEnum('event_status', EVENT_STATUSES);

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    kind: eventKindEnum('kind').notNull().default('otros'),
    title: text('title').notNull(),
    description: text('description'),
    location: text('location'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    priceCents: integer('price_cents').notNull().default(0),
    maxAttendees: integer('max_attendees'),
    photoUrl: text('photo_url'),
    status: eventStatusEnum('status').notNull().default('borrador'),
    createdBy: uuid('created_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byClubDate: index('events_club_date_idx').on(t.clubId, t.startsAt),
    byStatus: index('events_club_status_idx').on(t.clubId, t.status),
  }),
);
