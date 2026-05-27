import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { horses } from './horses';
import { riders } from './riders';

/**
 * Opinión de un jinete sobre un caballo. Visible al resto del club.
 */
export const horseReviews = pgTable(
  'horse_reviews',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    horseId: uuid('horse_id')
      .notNull()
      .references(() => horses.id, { onDelete: 'cascade' }),
    riderId: uuid('rider_id')
      .notNull()
      .references(() => riders.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull().default(5),
    title: text('title'),
    body: text('body'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byHorse: index('horse_reviews_horse_idx').on(t.horseId),
    byRider: index('horse_reviews_rider_idx').on(t.riderId),
    uniq: uniqueIndex('horse_reviews_horse_rider_unique').on(
      t.horseId,
      t.riderId,
    ),
  }),
);

/**
 * Afinidad jinete-caballo: cuántas veces lo ha montado, score agregado.
 * Se actualiza al confirmar asistencias y publicar reviews.
 */
export const horseAffinity = pgTable(
  'horse_affinity',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    horseId: uuid('horse_id')
      .notNull()
      .references(() => horses.id, { onDelete: 'cascade' }),
    riderId: uuid('rider_id')
      .notNull()
      .references(() => riders.id, { onDelete: 'cascade' }),
    ridesCount: integer('rides_count').notNull().default(0),
    score: integer('score').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniq: uniqueIndex('horse_affinity_horse_rider_unique').on(
      t.horseId,
      t.riderId,
    ),
    byRider: index('horse_affinity_rider_idx').on(t.riderId),
    byHorse: index('horse_affinity_horse_idx').on(t.horseId),
  }),
);
