'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq, ne, isNull } from 'drizzle-orm';
import { CLUB_PLANS, type ClubPlan } from '@equmanager/domain';

import { ensureSession } from '@/lib/db';

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export async function updateClubSettingsAction(formData: FormData) {
  const session = await ensureSession();
  if (!['owner', 'admin'].includes(session.primary.role)) redirect('/app');

  const clubId = session.primary.clubId;
  const name = String(formData.get('name') ?? '').trim();
  const slugRaw = String(formData.get('slug') ?? '').trim();
  const plan = (formData.get('plan') ?? 'free') as ClubPlan;
  const settings = {
    logoUrl: String(formData.get('logoUrl') ?? '').trim() || null,
    phone: String(formData.get('phone') ?? '').trim() || null,
    email: String(formData.get('email') ?? '').trim() || null,
    website: String(formData.get('website') ?? '').trim() || null,
    address: String(formData.get('address') ?? '').trim() || null,
    about: String(formData.get('about') ?? '').trim() || null,
  };

  if (name.length < 2) return;
  if (!CLUB_PLANS.includes(plan)) return;

  let slug = slugify(slugRaw || name);
  if (!slug) slug = `club-${Date.now().toString(36)}`;
  // Si el slug colisiona con otro club, lo dejamos como estaba.
  const [conflict] = await db
    .select({ id: schema.clubs.id })
    .from(schema.clubs)
    .where(and(eq(schema.clubs.slug, slug), ne(schema.clubs.id, clubId)))
    .limit(1);
  if (conflict) {
    const [current] = await db
      .select({ slug: schema.clubs.slug })
      .from(schema.clubs)
      .where(eq(schema.clubs.id, clubId))
      .limit(1);
    slug = current?.slug ?? slug;
  }

  await db
    .update(schema.clubs)
    .set({
      name,
      slug,
      plan,
      settings,
      updatedAt: new Date(),
    })
    .where(eq(schema.clubs.id, clubId));

  revalidatePath('/app', 'layout');
}

/**
 * Vincula el club operativo con una entrada del directorio público.
 * Solo el owner del club puede hacerlo. Rechaza si la entrada del
 * directorio ya está reclamada por otro club.
 */
export async function linkToDirectoryAction(formData: FormData) {
  const session = await ensureSession();
  if (!['owner', 'admin'].includes(session.primary.role)) redirect('/app');

  const clubId = session.primary.clubId;
  const directoryClubId =
    String(formData.get('directoryClubId') ?? '').trim() || null;
  if (!directoryClubId) return;

  // ¿Existe?
  const [dir] = await db
    .select()
    .from(schema.directoryClubs)
    .where(eq(schema.directoryClubs.id, directoryClubId))
    .limit(1);
  if (!dir) return;

  // ¿Reclamada por otro?
  const [reclaimed] = await db
    .select({ id: schema.clubs.id })
    .from(schema.clubs)
    .where(
      and(
        eq(schema.clubs.directoryClubId, dir.id),
        ne(schema.clubs.id, clubId),
      ),
    )
    .limit(1);
  if (reclaimed) return;

  // Rellenamos huecos en settings con los datos del directorio (sin pisar
  // lo que el owner ya hubiera puesto).
  const [club] = await db
    .select({ settings: schema.clubs.settings })
    .from(schema.clubs)
    .where(eq(schema.clubs.id, clubId))
    .limit(1);
  const current = (club?.settings as Record<string, unknown>) ?? {};
  const merged: Record<string, unknown> = { ...current };
  const fill = (k: string, v: string | null) => {
    if (v && !merged[k]) merged[k] = v;
  };
  fill('phone', dir.phone);
  fill('email', dir.email);
  fill('website', dir.website);
  fill(
    'address',
    [dir.address, dir.city, dir.postalCode].filter(Boolean).join(', ') ||
      null,
  );

  await db
    .update(schema.clubs)
    .set({
      directoryClubId: dir.id,
      settings: merged,
      updatedAt: new Date(),
    })
    .where(eq(schema.clubs.id, clubId));

  revalidatePath('/app/club-settings');
}

export async function unlinkFromDirectoryAction(_formData: FormData) {
  const session = await ensureSession();
  if (!['owner', 'admin'].includes(session.primary.role)) redirect('/app');
  await db
    .update(schema.clubs)
    .set({ directoryClubId: null, updatedAt: new Date() })
    .where(eq(schema.clubs.id, session.primary.clubId));
  revalidatePath('/app/club-settings');
}
