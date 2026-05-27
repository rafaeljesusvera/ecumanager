import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';

/**
 * Devuelve el rider asociado al profile en el club actual, creándolo si
 * el usuario es nuevo y entró como rider.
 */
export async function ensureRiderForProfile(
  profileId: string,
  clubId: string,
  fallbackName?: string | null,
  fallbackEmail?: string | null,
) {
  const [existing] = await db
    .select()
    .from(schema.riders)
    .where(
      and(
        eq(schema.riders.clubId, clubId),
        eq(schema.riders.profileId, profileId),
      ),
    )
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(schema.riders)
    .values({
      clubId,
      profileId,
      name: fallbackName ?? fallbackEmail ?? 'Nuevo alumno',
      email: fallbackEmail,
      category: 'adulto',
      tier: 'iniciacion',
    })
    .returning();
  return created;
}
