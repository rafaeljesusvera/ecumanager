'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import {
  PROVIDER_SPECIALTIES,
  type ProviderSpecialty,
} from '@equmanager/domain';

import { ensureSession } from '@/lib/db';

export async function updateProviderProfileAction(formData: FormData) {
  const session = await ensureSession();
  const specialty = String(formData.get('specialty') ?? '') as ProviderSpecialty;
  if (!PROVIDER_SPECIALTIES.includes(specialty)) redirect('/app');

  const businessName =
    String(formData.get('businessName') ?? '').trim() || null;
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;

  const [existing] = await db
    .select()
    .from(schema.providerProfiles)
    .where(eq(schema.providerProfiles.profileId, session.user.id))
    .limit(1);

  if (existing) {
    await db
      .update(schema.providerProfiles)
      .set({
        specialty,
        businessName,
        phone,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(schema.providerProfiles.id, existing.id));
  } else {
    await db.insert(schema.providerProfiles).values({
      profileId: session.user.id,
      specialty,
      businessName,
      phone,
      notes,
    });
  }
  revalidatePath('/app/provider');
}
