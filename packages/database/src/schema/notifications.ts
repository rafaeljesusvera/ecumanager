import { sql } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { NOTIFICATION_KINDS } from '@equmanager/domain';

import { clubs, profiles } from './clubs';

export const notificationKindEnum = pgEnum(
  'notification_kind',
  NOTIFICATION_KINDS,
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    clubId: uuid('club_id').references(() => clubs.id, {
      onDelete: 'cascade',
    }),
    kind: notificationKindEnum('kind').notNull().default('sistema'),
    title: text('title').notNull(),
    body: text('body'),
    link: text('link'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    byProfileUnread: index('notifications_profile_unread_idx').on(
      t.profileId,
      t.readAt,
    ),
    byProfileDate: index('notifications_profile_date_idx').on(
      t.profileId,
      t.createdAt,
    ),
  }),
);
