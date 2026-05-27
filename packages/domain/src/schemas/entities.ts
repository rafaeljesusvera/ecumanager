import { z } from 'zod';
import {
  CLUB_PLANS,
  CLUB_ROLES,
  DISCIPLINES,
  HORSE_KINDS,
  HORSE_STATUSES,
  LESSON_STATUSES,
  RIDER_CATEGORIES,
  RIDER_TIERS,
} from '../types/enums';

// =============================================================================
// Helpers
// =============================================================================

/** UUID v4. Postgres genera UUIDs por nosotros. */
export const idSchema = z.string().uuid();

/** Slug seguro para URLs (a-z, 0-9, guiones). */
export const slugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, {
    message: 'Solo minúsculas, números y guiones; sin empezar/terminar en guion.',
  });

/** Email RFC simplificado. */
export const emailSchema = z.string().email().max(255);

// =============================================================================
// Club
// =============================================================================

export const clubSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: z.string().min(2).max(120),
  plan: z.enum(CLUB_PLANS).default('free'),
  settings: z.record(z.unknown()).default({}),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Club = z.infer<typeof clubSchema>;

export const createClubSchema = clubSchema.pick({ slug: true, name: true });
export type CreateClubInput = z.infer<typeof createClubSchema>;

// =============================================================================
// Membership (relación profile <-> club con rol)
// =============================================================================

export const clubMemberSchema = z.object({
  id: idSchema,
  clubId: idSchema,
  profileId: idSchema,
  role: z.enum(CLUB_ROLES),
  invitedBy: idSchema.nullable(),
  joinedAt: z.coerce.date(),
});
export type ClubMember = z.infer<typeof clubMemberSchema>;

// =============================================================================
// Horse
// =============================================================================

export const horseSchema = z.object({
  id: idSchema,
  clubId: idSchema,
  name: z.string().min(1).max(80),
  kind: z.enum(HORSE_KINDS),
  breed: z.string().max(80).nullable(),
  birthYear: z.number().int().min(1980).max(new Date().getFullYear()).nullable(),
  color: z.string().max(40).nullable(),
  status: z.enum(HORSE_STATUSES).default('activo'),
  photoUrl: z.string().url().nullable(),
  notes: z.string().max(2000).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Horse = z.infer<typeof horseSchema>;

export const createHorseSchema = horseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateHorseInput = z.infer<typeof createHorseSchema>;

export const updateHorseSchema = createHorseSchema.partial().extend({
  id: idSchema,
});
export type UpdateHorseInput = z.infer<typeof updateHorseSchema>;

// =============================================================================
// Rider
// =============================================================================

export const riderSchema = z.object({
  id: idSchema,
  clubId: idSchema,
  /** Si el jinete tiene cuenta de usuario, queda vinculado. */
  profileId: idSchema.nullable(),
  name: z.string().min(1).max(120),
  email: emailSchema.nullable(),
  phone: z.string().max(40).nullable(),
  category: z.enum(RIDER_CATEGORIES),
  tier: z.enum(RIDER_TIERS),
  joinedAt: z.coerce.date().nullable(),
  photoUrl: z.string().url().nullable(),
  notes: z.string().max(2000).nullable(),
  status: z.enum(['activo', 'baja']).default('activo'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Rider = z.infer<typeof riderSchema>;

export const createRiderSchema = riderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateRiderInput = z.infer<typeof createRiderSchema>;

// =============================================================================
// Lesson
// =============================================================================

export const lessonSchema = z.object({
  id: idSchema,
  clubId: idSchema,
  instructorId: idSchema,
  date: z.coerce.date(),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  discipline: z.enum(DISCIPLINES),
  status: z.enum(LESSON_STATUSES).default('programada'),
  notes: z.string().max(2000).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Lesson = z.infer<typeof lessonSchema>;

export const lessonObjectiveSchema = z.object({
  id: idSchema,
  lessonId: idSchema,
  text: z.string().min(1).max(300),
  order: z.number().int().min(0),
  completed: z.boolean().default(false),
});
export type LessonObjective = z.infer<typeof lessonObjectiveSchema>;

export const lessonAttendeeSchema = z.object({
  id: idSchema,
  lessonId: idSchema,
  riderId: idSchema,
  horseId: idSchema.nullable(),
  attended: z.boolean().default(false),
});
export type LessonAttendee = z.infer<typeof lessonAttendeeSchema>;

// =============================================================================
// Badges
// =============================================================================

export const badgeSchema = z.object({
  id: idSchema,
  clubId: idSchema,
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(80),
  description: z.string().max(500).nullable(),
  iconUrl: z.string().url().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#fbbf24'),
  createdAt: z.coerce.date(),
});
export type Badge = z.infer<typeof badgeSchema>;

export const riderBadgeSchema = z.object({
  id: idSchema,
  riderId: idSchema,
  badgeId: idSchema,
  awardedAt: z.coerce.date(),
  awardedBy: idSchema.nullable(),
  notes: z.string().max(500).nullable(),
});
export type RiderBadge = z.infer<typeof riderBadgeSchema>;
