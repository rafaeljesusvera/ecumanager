import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { PAYMENT_PROVIDERS, PAYMENT_STATUSES } from '@equmanager/domain';

import { clubs, profiles } from './clubs';

export const paymentStatusEnum = pgEnum('payment_status', PAYMENT_STATUSES);
export const paymentProviderEnum = pgEnum(
  'payment_provider',
  PAYMENT_PROVIDERS,
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('EUR'),
    status: paymentStatusEnum('status').notNull().default('pendiente'),
    provider: paymentProviderEnum('provider').notNull().default('stripe_fake'),
    reference: text('reference'),
    description: text('description'),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byClub: index('payments_club_idx').on(t.clubId),
    byProfile: index('payments_profile_idx').on(t.profileId),
    byStatus: index('payments_status_idx').on(t.status),
  }),
);
