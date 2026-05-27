import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { DISCIPLINES, LESSON_STATUSES } from '@equmanager/domain';

import { clubs, profiles } from './clubs';
import { horses } from './horses';
import { riders } from './riders';

export const disciplineEnum = pgEnum('discipline', DISCIPLINES);
export const lessonStatusEnum = pgEnum('lesson_status', LESSON_STATUSES);

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    instructorId: uuid('instructor_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'restrict' }),
    date: timestamp('date', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(60),
    discipline: disciplineEnum('discipline').notNull(),
    status: lessonStatusEnum('status').notNull().default('programada'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byClubDate: index('lessons_club_date_idx').on(t.clubId, t.date),
    byInstructor: index('lessons_instructor_idx').on(t.instructorId),
  }),
);

export const lessonObjectives = pgTable(
  'lesson_objectives',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    order: integer('order').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
  },
  (t) => ({
    byLesson: index('lesson_objectives_lesson_idx').on(t.lessonId, t.order),
  }),
);

export const lessonAttendees = pgTable(
  'lesson_attendees',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    riderId: uuid('rider_id')
      .notNull()
      .references(() => riders.id, { onDelete: 'cascade' }),
    horseId: uuid('horse_id').references(() => horses.id, {
      onDelete: 'set null',
    }),
    attended: boolean('attended').notNull().default(false),
  },
  (t) => ({
    uniq: uniqueIndex('lesson_attendees_lesson_rider_unique').on(
      t.lessonId,
      t.riderId,
    ),
    byRider: index('lesson_attendees_rider_idx').on(t.riderId),
  }),
);
