'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq, ne } from 'drizzle-orm';
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
