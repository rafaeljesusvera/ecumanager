'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import {
  RIDER_CATEGORIES,
  RIDER_TIERS,
  type RiderCategory,
  type RiderTier,
} from '@equmanager/domain';

import { ensureSession } from '@/lib/db';

async function assertStaff() {
  const session = await ensureSession();
  if (!['owner', 'admin', 'instructor'].includes(session.primary.role)) {
    redirect('/app');
  }
  return session;
}

export async function createRiderAction(formData: FormData) {
  const session = await assertStaff();
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim() || null;
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const category = (formData.get('category') ?? 'adulto') as RiderCategory;
  const tier = (formData.get('tier') ?? 'iniciacion') as RiderTier;
  const photoUrl = String(formData.get('photoUrl') ?? '').trim() || null;

  if (!name || !RIDER_CATEGORIES.includes(category) || !RIDER_TIERS.includes(tier))
    return;

  const [created] = await db
    .insert(schema.riders)
    .values({
      clubId: session.primary.clubId,
      name,
      email,
      phone,
      category,
      tier,
      photoUrl,
    })
    .returning();
  revalidatePath('/app/riders');
  if (created) redirect(`/app/riders/${created.id}`);
}

export async function updateRiderAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim() || null;
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const category = (formData.get('category') ?? 'adulto') as RiderCategory;
  const tier = (formData.get('tier') ?? 'iniciacion') as RiderTier;
  const photoUrl = String(formData.get('photoUrl') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;
  const status =
    (formData.get('status') ?? 'activo') === 'baja' ? 'baja' : 'activo';

  if (!name || !RIDER_CATEGORIES.includes(category) || !RIDER_TIERS.includes(tier))
    return;

  await db
    .update(schema.riders)
    .set({
      name,
      email,
      phone,
      category,
      tier,
      photoUrl,
      notes,
      status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.riders.id, id),
        eq(schema.riders.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/riders');
  revalidatePath(`/app/riders/${id}`);
}

export async function deleteRiderAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  await db
    .delete(schema.riders)
    .where(
      and(
        eq(schema.riders.id, id),
        eq(schema.riders.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/riders');
  redirect('/app/riders');
}
