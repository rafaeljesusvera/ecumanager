import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Artículos del centro de ayuda. Globales (no por club) por defecto.
 * `roleVisibility` es un array de roles que pueden verlo; vacío = todos.
 */
export const helpArticles = pgTable(
  'help_articles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    body: text('body').notNull(),
    section: text('section').notNull().default('general'),
    roleVisibility: text('role_visibility')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    order: integer('order').notNull().default(0),
    published: boolean('published').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    slugUnique: uniqueIndex('help_articles_slug_unique').on(t.slug),
    bySection: index('help_articles_section_idx').on(t.section, t.order),
  }),
);
