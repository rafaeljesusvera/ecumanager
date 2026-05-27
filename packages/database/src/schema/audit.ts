/**
 * Registro de auditoría: cada acción de escritura relevante deja huella.
 * Útil para soporte, debug y, llegado el caso, requisitos legales.
 */
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { clubs, profiles } from './clubs';

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id').references(() => clubs.id, {
      onDelete: 'cascade',
    }),
    actorId: uuid('actor_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    /** Verbo en imperativo: "create", "update", "delete", "invite", etc. */
    action: text('action').notNull(),
    /** Recurso afectado: "horse", "rider", "lesson", "badge"... */
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    /** Diff o payload contextual. */
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byClubDate: index('audit_log_club_date_idx').on(t.clubId, t.createdAt),
    byEntity: index('audit_log_entity_idx').on(t.entityType, t.entityId),
  }),
);
