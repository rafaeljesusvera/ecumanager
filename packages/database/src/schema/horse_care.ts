import { sql } from 'drizzle-orm';
import {
  date,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { clubs, profiles } from './clubs';
import { horses } from './horses';

/**
 * Plantillas de checklist diaria/semanal por club.
 * `items` es un jsonb con la forma:
 *   [{ key: 'alimentacion', label: 'Alimentación', kind: 'alimentacion' }, ...]
 */
export const horseCareTemplates = pgTable(
  'horse_care_templates',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    items: jsonb('items').notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byClub: index('horse_care_templates_club_idx').on(t.clubId),
  }),
);

/**
 * Registro de checklist completado por un mozo para un caballo en un día.
 * `itemsDone` jsonb: [{ key, done: bool, notes?: string }, ...]
 */
export const horseCareLogs = pgTable(
  'horse_care_logs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    horseId: uuid('horse_id')
      .notNull()
      .references(() => horses.id, { onDelete: 'cascade' }),
    groomId: uuid('groom_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    templateId: uuid('template_id').references(() => horseCareTemplates.id, {
      onDelete: 'set null',
    }),
    forDate: date('for_date').notNull(),
    itemsDone: jsonb('items_done').notNull().default(sql`'[]'::jsonb`),
    notes: text('notes'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byHorseDate: index('horse_care_logs_horse_date_idx').on(
      t.horseId,
      t.forDate,
    ),
    byClubDate: index('horse_care_logs_club_date_idx').on(t.clubId, t.forDate),
    byGroom: index('horse_care_logs_groom_idx').on(t.groomId),
  }),
);
