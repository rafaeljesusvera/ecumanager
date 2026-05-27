'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';

import { ensureSession } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';

export async function postReviewAction(formData: FormData) {
  const session = await ensureSession();
  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );
  if (!rider) redirect('/app');

  const horseId = String(formData.get('horseId'));
  const rating = Math.max(1, Math.min(5, Number(formData.get('rating')) || 5));
  const title = String(formData.get('title') ?? '').trim() || null;
  const body = String(formData.get('body') ?? '').trim() || null;

  await db
    .insert(schema.horseReviews)
    .values({
      horseId,
      riderId: rider.id,
      rating,
      title,
      body,
    })
    .onConflictDoUpdate({
      target: [schema.horseReviews.horseId, schema.horseReviews.riderId],
      set: { rating, title, body, updatedAt: new Date() },
    });

  revalidatePath('/app/me/horses');
}
