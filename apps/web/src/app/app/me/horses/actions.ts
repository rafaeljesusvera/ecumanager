'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { HORSE_KINDS, type HorseKind } from '@equmanager/domain';

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

/**
 * Un alumno da de alta su propio caballo en propiedad. Crea horse +
 * horse_owners + (si no lo tiene) club_member con role=horse_owner,
 * manteniendo su rol de rider.
 */
export async function registerOwnedHorseAction(formData: FormData) {
  const session = await ensureSession();
  const name = String(formData.get('name') ?? '').trim();
  const kind = (formData.get('kind') ?? 'caballo') as HorseKind;
  const breed = String(formData.get('breed') ?? '').trim() || null;
  const birthYear = Number(formData.get('birthYear')) || null;
  const color = String(formData.get('color') ?? '').trim() || null;
  const photoUrl = String(formData.get('photoUrl') ?? '').trim() || null;

  if (!name || !HORSE_KINDS.includes(kind)) {
    redirect('/app/me/horses?error=' + encodeURIComponent('Datos inválidos'));
  }

  const [horse] = await db
    .insert(schema.horses)
    .values({
      clubId: session.primary.clubId,
      name,
      kind,
      breed,
      birthYear,
      color,
      photoUrl,
    })
    .returning();
  if (!horse) return;

  await db.insert(schema.horseOwners).values({
    horseId: horse.id,
    profileId: session.user.id,
    role: 'owner',
  });

  const alreadyHorseOwner = session.memberships.some(
    (m) => m.clubId === session.primary.clubId && m.role === 'horse_owner',
  );
  if (!alreadyHorseOwner) {
    await db.insert(schema.clubMembers).values({
      clubId: session.primary.clubId,
      profileId: session.user.id,
      role: 'horse_owner',
    });
  }

  await db.insert(schema.notifications).values({
    profileId: session.user.id,
    clubId: session.primary.clubId,
    kind: 'sistema',
    title: `Caballo "${name}" registrado`,
    body: 'Tienes activado el panel de propietario.',
    link: '/app/horse-owner',
  });

  revalidatePath('/app', 'layout');
  redirect(`/app/horse-owner/${horse.id}`);
}
