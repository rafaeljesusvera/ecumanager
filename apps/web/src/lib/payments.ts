import { db, schema } from '@equmanager/database';

/**
 * Simula un pago con Stripe. Crea un Payment en `completado` inmediatamente.
 * Cuando integremos Stripe real, este punto será reemplazado por una llamada
 * a `stripe.paymentIntents.create` + webhook que actualiza el status.
 */
export async function processFakePayment(args: {
  clubId: string;
  profileId: string;
  amountCents: number;
  description: string;
  reference?: string;
}) {
  const [payment] = await db
    .insert(schema.payments)
    .values({
      clubId: args.clubId,
      profileId: args.profileId,
      amountCents: args.amountCents,
      description: args.description,
      reference: args.reference ?? `fake_${Date.now().toString(36)}`,
      provider: 'stripe_fake',
      status: 'completado',
      completedAt: new Date(),
      metadata: { simulated: true },
    })
    .returning();
  if (!payment) throw new Error('No se pudo crear el pago simulado');
  return payment;
}
