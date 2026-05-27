import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { COURSE_STATUSES, DISCIPLINES } from '@equmanager/domain';

import { clubs, profiles } from './clubs';

export const courseStatusEnum = pgEnum('course_status', COURSE_STATUSES);

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    discipline: text('discipline').notNull().default('iniciacion'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    priceCents: integer('price_cents').notNull().default(0),
    maxStudents: integer('max_students'),
    photoUrl: text('photo_url'),
    status: courseStatusEnum('status').notNull().default('borrador'),
    createdBy: uuid('created_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byClub: index('courses_club_idx').on(t.clubId),
    byStatus: index('courses_club_status_idx').on(t.clubId, t.status),
  }),
);

export const courseSessions = pgTable(
  'course_sessions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    date: timestamp('date', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(60),
    notes: text('notes'),
  },
  (t) => ({
    byCourseDate: index('course_sessions_course_date_idx').on(
      t.courseId,
      t.date,
    ),
  }),
);
