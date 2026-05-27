'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';

import { ensureSession } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { processFakePayment } from '@/lib/payments';

export async function enrollInEventAction(formData: FormData) {
  const session = await ensureSession();
  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );
  if (!rider) redirect('/app');

  const eventId = String(formData.get('eventId'));
  const priceCents = Number(formData.get('priceCents')) || 0;

  let paymentId: string | null = null;
  if (priceCents > 0) {
    const payment = await processFakePayment({
      clubId: session.primary.clubId,
      profileId: session.user.id,
      amountCents: priceCents,
      description: 'Inscripción a evento',
    });
    paymentId = payment.id;
  }

  await db.insert(schema.enrollments).values({
    clubId: session.primary.clubId,
    profileId: session.user.id,
    riderId: rider.id,
    targetType: 'evento',
    targetId: eventId,
    status: priceCents > 0 ? 'confirmada' : 'pendiente',
    paymentId,
    confirmedAt: priceCents > 0 ? new Date() : null,
  });

  await db.insert(schema.notifications).values({
    profileId: session.user.id,
    clubId: session.primary.clubId,
    kind: 'inscripcion',
    title: 'Inscripción registrada',
    body:
      priceCents > 0
        ? `Pago de ${(priceCents / 100).toFixed(2)} € confirmado.`
        : 'Te has apuntado, sin coste.',
    link: '/app/me/events',
  });

  revalidatePath('/app/me/events');
}
