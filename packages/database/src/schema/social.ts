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

import { clubs, profiles } from './clubs';

export const connectionStatusEnum = pgEnum('connection_status', [
  'pendiente',
  'aceptada',
  'bloqueada',
]);

export const connections = pgTable(
  'connections',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    requesterId: uuid('requester_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    recipientId: uuid('recipient_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    status: connectionStatusEnum('status').notNull().default('pendiente'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniqPair: uniqueIndex('connections_pair_unique').on(
      t.requesterId,
      t.recipientId,
    ),
    byRecipient: index('connections_recipient_idx').on(t.recipientId),
  }),
);

export const socialPosts = pgTable(
  'social_posts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    authorId: uuid('author_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    clubId: uuid('club_id').references(() => clubs.id, {
      onDelete: 'set null',
    }),
    body: text('body').notNull(),
    photoUrl: text('photo_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byAuthor: index('social_posts_author_idx').on(t.authorId, t.createdAt),
    byCreated: index('social_posts_created_idx').on(t.createdAt),
  }),
);

export const socialLikes = pgTable(
  'social_likes',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    postId: uuid('post_id')
      .notNull()
      .references(() => socialPosts.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniqPostProfile: uniqueIndex('social_likes_post_profile_unique').on(
      t.postId,
      t.profileId,
    ),
  }),
);
