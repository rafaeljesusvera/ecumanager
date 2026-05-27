/**
 * Tablas raíz: clubs, profiles (extiende auth.users de Supabase) y la
 * relación N:M club_members con rol.
 *
 * Las RLS policies se aplican en migraciones SQL específicas, no en TS.
 */
import { sql } from 'drizzle-orm';
import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { CLUB_PLANS, CLUB_ROLES } from '@equmanager/domain';

// =============================================================================
// Enums
// =============================================================================

export const clubPlanEnum = pgEnum('club_plan', CLUB_PLANS);
export const clubRoleEnum = pgEnum('club_role', CLUB_ROLES);

// =============================================================================
// profiles
// -----------------------------------------------------------------------------
// Extiende auth.users de Supabase. La FK se crea en SQL para referenciar el
// schema "auth", que Drizzle no gestiona.
// =============================================================================

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// =============================================================================
// clubs
// =============================================================================

export const clubs = pgTable(
  'clubs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    plan: clubPlanEnum('plan').notNull().default('free'),
    settings: jsonb('settings').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    slugUnique: uniqueIndex('clubs_slug_unique').on(t.slug),
  }),
);

// =============================================================================
// club_members
// =============================================================================

export const clubMembers = pgTable(
  'club_members',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: clubRoleEnum('role').notNull(),
    invitedBy: uuid('invited_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniqMembership: uniqueIndex('club_members_club_profile_unique').on(
      t.clubId,
      t.profileId,
    ),
  }),
);
