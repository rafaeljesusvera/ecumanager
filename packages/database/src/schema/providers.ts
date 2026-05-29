import { sql } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { PROVIDER_SPECIALTIES } from '@equmanager/domain';

import { profiles } from './clubs';

export const providerSpecialtyEnum = pgEnum(
  'provider_specialty',
  PROVIDER_SPECIALTIES,
);

export const providerProfiles = pgTable(
  'provider_profiles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    specialty: providerSpecialtyEnum('specialty').notNull(),
    businessName: text('business_name'),
    phone: text('phone'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniqProfileSpecialty: uniqueIndex(
      'provider_profiles_profile_specialty_unique',
    ).on(t.profileId, t.specialty),
  }),
);
