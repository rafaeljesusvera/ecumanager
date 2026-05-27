'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';

import { ensureSession } from '@/lib/db';

async function assertStaff() {
  const session = await ensureSession();
  if (!['owner', 'admin', 'instructor'].includes(session.primary.role)) {
    redirect('/app');
  }
  return session;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}

export async function createBadgeAction(formData: FormData) {
  const session = await assertStaff();
  const name = String(formData.get('name') ?? '').trim();
  const subtitle = String(formData.get('subtitle') ?? '').trim() || null;
  const categoryLabel =
    String(formData.get('categoryLabel') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const color = String(formData.get('color') ?? '#3f8649').trim();
  const iconUrl = String(formData.get('iconUrl') ?? '').trim() || null;

  if (!name) return;

  const code = slugify(name) + '_' + Date.now().toString(36).slice(-4);

  const [created] = await db
    .insert(schema.badges)
    .values({
      clubId: session.primary.clubId,
      code,
      name,
      subtitle,
      categoryLabel,
      description,
      color,
      iconUrl,
    })
    .returning();
  revalidatePath('/app/badges');
  if (created) redirect(`/app/badges/${created.id}`);
}

export async function updateBadgeAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  const subtitle = String(formData.get('subtitle') ?? '').trim() || null;
  const categoryLabel =
    String(formData.get('categoryLabel') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const color = String(formData.get('color') ?? '#3f8649').trim();
  const iconUrl = String(formData.get('iconUrl') ?? '').trim() || null;

  if (!name) return;

  await db
    .update(schema.badges)
    .set({ name, subtitle, categoryLabel, description, color, iconUrl })
    .where(
      and(
        eq(schema.badges.id, id),
        eq(schema.badges.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/badges');
  revalidatePath(`/app/badges/${id}`);
}

export async function deleteBadgeAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  await db
    .delete(schema.badges)
    .where(
      and(
        eq(schema.badges.id, id),
        eq(schema.badges.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/badges');
  redirect('/app/badges');
}

export async function awardBadgeAction(formData: FormData) {
  const session = await assertStaff();
  const badgeId = String(formData.get('badgeId'));
  const riderId = String(formData.get('riderId'));
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (!badgeId || !riderId) return;

  // Verifica que badge pertenece al club
  const [badge] = await db
    .select()
    .from(schema.badges)
    .where(
      and(
        eq(schema.badges.id, badgeId),
        eq(schema.badges.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!badge) return;

  await db
    .insert(schema.riderBadges)
    .values({
      badgeId,
      riderId,
      awardedBy: session.user.id,
      notes,
    })
    .onConflictDoUpdate({
      target: [schema.riderBadges.riderId, schema.riderBadges.badgeId],
      set: { notes, awardedBy: session.user.id, awardedAt: new Date() },
    });

  // Notifica al alumno si tiene profile
  const [rider] = await db
    .select({ profileId: schema.riders.profileId })
    .from(schema.riders)
    .where(eq(schema.riders.id, riderId))
    .limit(1);
  if (rider?.profileId) {
    await db.insert(schema.notifications).values({
      profileId: rider.profileId,
      clubId: session.primary.clubId,
      kind: 'insignia',
      title: `Nueva insignia: ${badge.name}`,
      body: notes ?? badge.description ?? 'Has recibido una nueva insignia.',
      link: '/app/me/badges',
    });
  }

  revalidatePath(`/app/badges/${badgeId}`);
  revalidatePath('/app/me/badges');
}

export async function revokeBadgeAction(formData: FormData) {
  await assertStaff();
  const id = String(formData.get('id'));
  const badgeId = String(formData.get('badgeId'));
  await db.delete(schema.riderBadges).where(eq(schema.riderBadges.id, id));
  revalidatePath(`/app/badges/${badgeId}`);
  revalidatePath('/app/me/badges');
}
