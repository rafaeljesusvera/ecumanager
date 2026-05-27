import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { clubs } from './clubs';
import { riders } from './riders';

export const bonos = pgTable(
  'bonos',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    photoUrl: text('photo_url'),
    totalClasses: integer('total_classes').notNull().default(10),
    priceCents: integer('price_cents').notNull().default(0),
    validityDays: integer('validity_days').notNull().default(180),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byClub: index('bonos_club_idx').on(t.clubId),
  }),
);

export const bonoPurchases = pgTable(
  'bono_purchases',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    bonoId: uuid('bono_id')
      .notNull()
      .references(() => bonos.id, { onDelete: 'cascade' }),
    riderId: uuid('rider_id')
      .notNull()
      .references(() => riders.id, { onDelete: 'cascade' }),
    classesLeft: integer('classes_left').notNull(),
    purchasedAt: timestamp('purchased_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    paymentId: uuid('payment_id'),
  },
  (t) => ({
    byRider: index('bono_purchases_rider_idx').on(t.riderId),
    byBono: index('bono_purchases_bono_idx').on(t.bonoId),
  }),
);
