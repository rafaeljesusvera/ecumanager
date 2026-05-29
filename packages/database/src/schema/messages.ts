import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { clubs, profiles } from './clubs';

export const messageThreadKindEnum = pgEnum('message_thread_kind', [
  'direct',
  'broadcast',
]);

export const messageThreads = pgTable(
  'message_threads',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clubId: uuid('club_id').references(() => clubs.id, {
      onDelete: 'cascade',
    }),
    kind: messageThreadKindEnum('kind').notNull().default('direct'),
    title: text('title'),
    createdBy: uuid('created_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byClub: index('message_threads_club_idx').on(t.clubId),
    byLast: index('message_threads_last_idx').on(t.lastMessageAt),
  }),
);

export const threadParticipants = pgTable(
  'thread_participants',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => messageThreads.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    muted: boolean('muted').notNull().default(false),
  },
  (t) => ({
    uniqThreadProfile: uniqueIndex('thread_participants_thread_profile_unique').on(
      t.threadId,
      t.profileId,
    ),
    byProfile: index('thread_participants_profile_idx').on(t.profileId),
  }),
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => messageThreads.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byThreadCreated: index('messages_thread_created_idx').on(
      t.threadId,
      t.createdAt,
    ),
  }),
);
