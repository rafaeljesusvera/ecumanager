import { sql } from 'drizzle-orm';
import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { RIDER_CATEGORIES, RIDER_TIERS } from '@equmanager/domain';

import { clubs, profiles } from './clubs';

export const riderCategoryEnum = pgEnum('rider_category', RIDER_CATEGORIES);
export const riderTierEnum = pgEnum('rider_tier', RIDER_TIERS);
export const riderStatusEnum = pgEnum('rider_status', ['activo', 'baja']);

export const riders = pgTable(
  'riders',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    /**
     * profileId puede ser NULL: jinetes menores sin cuenta aún, o invitados
     * gestionados solo por el club.
     */
    profileId: uuid('profile_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    category: riderCategoryEnum('category').notNull(),
    tier: riderTierEnum('tier').notNull(),
    joinedAt: date('joined_at'),
    birthdate: date('birthdate'),
    photoUrl: text('photo_url'),
    notes: text('notes'),
    status: riderStatusEnum('status').notNull().default('activo'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byClub: index('riders_club_idx').on(t.clubId),
    byProfile: index('riders_profile_idx').on(t.profileId),
  }),
);
