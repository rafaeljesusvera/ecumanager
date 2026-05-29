/**
 * Vínculo entre perfiles para permitir "cambiar de cuenta" estilo Google.
 *
 * - ownerProfileId: el usuario que está logueado y "asume" otro perfil.
 * - targetProfileId: el perfil destino (puede ser NULL si el destino es un
 *   rider sin cuenta propia, gestionado únicamente por sus tutores).
 * - riderId: opcional. Si está, indica que el "asumido" es un rider sin
 *   profile propio y las queries deben filtrarse por este rider.
 * - relation: parentesco o tipo de relación (padre, tutor, secretaria, etc).
 * - status: activa | pendiente (invitación enviada) | revocada.
 *
 * Restricción de negocio:
 *   - Si targetProfileId IS NOT NULL: el par (owner, target) debe ser único.
 *   - Si riderId IS NOT NULL: el par (owner, rider) debe ser único.
 */
import { sql } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import {
  PROFILE_LINK_RELATIONS,
  PROFILE_LINK_STATUSES,
} from '@equmanager/domain';

import { profiles } from './clubs';
import { riders } from './riders';

export const profileLinkRelationEnum = pgEnum(
  'profile_link_relation',
  PROFILE_LINK_RELATIONS,
);

export const profileLinkStatusEnum = pgEnum(
  'profile_link_status',
  PROFILE_LINK_STATUSES,
);

export const profileLinks = pgTable(
  'profile_links',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    ownerProfileId: uuid('owner_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    targetProfileId: uuid('target_profile_id').references(() => profiles.id, {
      onDelete: 'cascade',
    }),
    riderId: uuid('rider_id').references(() => riders.id, {
      onDelete: 'cascade',
    }),
    relation: profileLinkRelationEnum('relation').notNull(),
    label: text('label'),
    status: profileLinkStatusEnum('status').notNull().default('activa'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byOwner: index('profile_links_owner_idx').on(t.ownerProfileId),
    uniqOwnerTarget: uniqueIndex('profile_links_owner_target_unique')
      .on(t.ownerProfileId, t.targetProfileId)
      .where(sql`target_profile_id is not null`),
    uniqOwnerRider: uniqueIndex('profile_links_owner_rider_unique')
      .on(t.ownerProfileId, t.riderId)
      .where(sql`rider_id is not null`),
  }),
);
