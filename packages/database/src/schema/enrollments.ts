import { sql } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import {
  ENROLLMENT_STATUSES,
  ENROLLMENT_TARGET_TYPES,
} from '@equmanager/domain';

import { clubs, profiles } from './clubs';
import { riders } from './riders';

export const enrollmentTargetTypeEnum = pgEnum(
  'enrollment_target_type',
  ENROLLMENT_TARGET_TYPES,
);
export const enrollmentStatusEnum = pgEnum(
  'enrollment_status',
  ENROLLMENT_STATUSES,
);

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    riderId: uuid('rider_id').references(() => riders.id, {
      onDelete: 'set null',
    }),
    targetType: enrollmentTargetTypeEnum('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    status: enrollmentStatusEnum('status').notNull().default('pendiente'),
    notes: text('notes'),
    paymentId: uuid('payment_id'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byClub: index('enrollments_club_idx').on(t.clubId),
    byTarget: index('enrollments_target_idx').on(t.targetType, t.targetId),
    byProfile: index('enrollments_profile_idx').on(t.profileId),
    byRider: index('enrollments_rider_idx').on(t.riderId),
  }),
);
