import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { HORSE_KINDS, HORSE_STATUSES } from '@equmanager/domain';

import { clubs, profiles } from './clubs';

export const horseKindEnum = pgEnum('horse_kind', HORSE_KINDS);
export const horseStatusEnum = pgEnum('horse_status', HORSE_STATUSES);

/**
 * Rol del profile sobre el caballo:
 *  - owner: propietario único del animal (solo uno por caballo)
 *  - authorized: tiene permiso para montarlo / gestionarlo parcialmente
 */
export const horseOwnerRoleEnum = pgEnum('horse_owner_role', [
  'owner',
  'authorized',
]);

export const horses = pgTable(
  'horses',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kind: horseKindEnum('kind').notNull(),
    breed: text('breed'),
    birthYear: integer('birth_year'),
    color: text('color'),
    status: horseStatusEnum('status').notNull().default('activo'),
    photoUrl: text('photo_url'),
    notes: text('notes'),
    careTemplateId: uuid('care_template_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byClub: index('horses_club_idx').on(t.clubId),
    byName: index('horses_club_name_idx').on(t.clubId, t.name),
  }),
);

export const horseOwners = pgTable(
  'horse_owners',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    horseId: uuid('horse_id')
      .notNull()
      .references(() => horses.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: horseOwnerRoleEnum('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniq: uniqueIndex('horse_owners_horse_profile_unique').on(
      t.horseId,
      t.profileId,
    ),
    byHorse: index('horse_owners_horse_idx').on(t.horseId),
    byProfile: index('horse_owners_profile_idx').on(t.profileId),
  }),
);
