import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { FEEDBACK_SOURCES, VOICE_NOTE_STATUSES } from '@equmanager/domain';

import { clubs, profiles } from './clubs';
import { lessons } from './lessons';
import { riders } from './riders';

export const voiceNoteStatusEnum = pgEnum(
  'voice_note_status',
  VOICE_NOTE_STATUSES,
);
export const feedbackSourceEnum = pgEnum('feedback_source', FEEDBACK_SOURCES);

/**
 * Nota de voz subida por un instructor.
 * El flujo IA la transcribe, la cruza con el contexto del club (alumnos del
 * día, caballos) y genera un `structuredOutput` con sugerencias de feedback.
 */
export const aiVoiceNotes = pgTable(
  'ai_voice_notes',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    instructorId: uuid('instructor_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id').references(() => lessons.id, {
      onDelete: 'set null',
    }),
    audioUrl: text('audio_url'),
    transcript: text('transcript'),
    summary: text('summary'),
    structuredOutput: jsonb('structured_output')
      .notNull()
      .default(sql`'{}'::jsonb`),
    status: voiceNoteStatusEnum('status').notNull().default('subida'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byClub: index('ai_voice_notes_club_idx').on(t.clubId),
    byInstructor: index('ai_voice_notes_instructor_idx').on(t.instructorId),
    byStatus: index('ai_voice_notes_status_idx').on(t.status),
  }),
);

/**
 * Feedback escrito por instructor (o generado por IA y confirmado) sobre un
 * jinete en una clase. Visible al alumno en su panel.
 */
export const lessonFeedback = pgTable(
  'lesson_feedback',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    lessonId: uuid('lesson_id').references(() => lessons.id, {
      onDelete: 'cascade',
    }),
    riderId: uuid('rider_id')
      .notNull()
      .references(() => riders.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    source: feedbackSourceEnum('source').notNull().default('manual'),
    voiceNoteId: uuid('voice_note_id').references(() => aiVoiceNotes.id, {
      onDelete: 'set null',
    }),
    badgesSuggested: jsonb('badges_suggested')
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdBy: uuid('created_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byLesson: index('lesson_feedback_lesson_idx').on(t.lessonId),
    byRider: index('lesson_feedback_rider_idx').on(t.riderId),
  }),
);
