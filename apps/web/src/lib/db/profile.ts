import { db, schema } from '@equmanager/database';
import { and, desc, eq } from 'drizzle-orm';

import type { ClubRole } from '@equmanager/domain';

export type CurrentSession = {
  user: { id: string; email: string };
  profile: typeof schema.profiles.$inferSelect | null;
  memberships: Array<{
    id: string;
    clubId: string;
    role: ClubRole;
    joinedAt: Date;
    clubName: string;
    clubSlug: string;
  }>;
  primary: {
    clubId: string;
    role: ClubRole;
    clubName: string;
    clubSlug: string;
  } | null;
};

/**
 * Carga el profile + memberships del usuario actual.
 * Crea el profile si no existe (caso "primer login").
 */
export async function loadSession(user: {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown> | null;
}): Promise<CurrentSession> {
  const existing = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, user.id))
    .limit(1);

  let profile = existing[0] ?? null;

  if (!profile) {
    const fullName =
      typeof user.user_metadata?.full_name === 'string'
        ? (user.user_metadata.full_name as string)
        : null;
    const [created] = await db
      .insert(schema.profiles)
      .values({
        id: user.id,
        email: user.email,
        fullName,
      })
      .returning();
    profile = created ?? null;
  }

  const memberships = await db
    .select({
      id: schema.clubMembers.id,
      clubId: schema.clubMembers.clubId,
      role: schema.clubMembers.role,
      joinedAt: schema.clubMembers.joinedAt,
      clubName: schema.clubs.name,
      clubSlug: schema.clubs.slug,
    })
    .from(schema.clubMembers)
    .innerJoin(schema.clubs, eq(schema.clubs.id, schema.clubMembers.clubId))
    .where(eq(schema.clubMembers.profileId, user.id))
    .orderBy(desc(schema.clubMembers.joinedAt));

  const primary = memberships[0]
    ? {
        clubId: memberships[0].clubId,
        role: memberships[0].role,
        clubName: memberships[0].clubName,
        clubSlug: memberships[0].clubSlug,
      }
    : null;

  return {
    user: { id: user.id, email: user.email },
    profile,
    memberships,
    primary,
  };
}

/**
 * Devuelve el membership de un club para un perfil, o null.
 */
export async function getMembership(profileId: string, clubId: string) {
  const [row] = await db
    .select()
    .from(schema.clubMembers)
    .where(
      and(
        eq(schema.clubMembers.profileId, profileId),
        eq(schema.clubMembers.clubId, clubId),
      ),
    )
    .limit(1);
  return row ?? null;
}
