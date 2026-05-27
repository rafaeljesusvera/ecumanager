'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';

import { ensureSession } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { processFakePayment } from '@/lib/payments';

export async function buyBonoAction(formData: FormData) {
  const session = await ensureSession();
  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );
  if (!rider) redirect('/app');

  const bonoId = String(formData.get('bonoId'));

  const [bono] = await db
    .select()
    .from(schema.bonos)
    .where(
      and(
        eq(schema.bonos.id, bonoId),
        eq(schema.bonos.clubId, session.primary.clubId),
        eq(schema.bonos.active, true),
      ),
    )
    .limit(1);

  if (!bono) redirect('/app/me/bonos?error=bono');

  const payment = await processFakePayment({
    clubId: session.primary.clubId,
    profileId: session.user.id,
    amountCents: bono.priceCents,
    description: `Bono ${bono.name}`,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + bono.validityDays);

  await db.insert(schema.bonoPurchases).values({
    bonoId: bono.id,
    riderId: rider.id,
    classesLeft: bono.totalClasses,
    expiresAt,
    paymentId: payment.id,
  });

  await db.insert(schema.notifications).values({
    profileId: session.user.id,
    clubId: session.primary.clubId,
    kind: 'pago',
    title: `Bono "${bono.name}" comprado`,
    body: `${bono.totalClasses} clases válidas durante ${bono.validityDays} días.`,
    link: '/app/me/bonos',
  });

  revalidatePath('/app/me/bonos');
}
