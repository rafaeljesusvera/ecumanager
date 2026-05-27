'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';

import { ensureSession } from '@/lib/db';
import { parseEurosToCents } from '@/lib/format';

async function assertStaff() {
  const session = await ensureSession();
  if (!['owner', 'admin', 'instructor'].includes(session.primary.role)) {
    redirect('/app');
  }
  return session;
}

export async function createBonoAction(formData: FormData) {
  const session = await assertStaff();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const totalClasses = Number(formData.get('totalClasses')) || 10;
  const priceCents = parseEurosToCents(String(formData.get('price')));
  const validityDays = Number(formData.get('validityDays')) || 180;

  if (!name) return;

  await db.insert(schema.bonos).values({
    clubId: session.primary.clubId,
    name,
    description,
    totalClasses,
    priceCents,
    validityDays,
  });
  revalidatePath('/app/bonos');
}

export async function toggleBonoActiveAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  const active = formData.get('active') === 'true';
  await db
    .update(schema.bonos)
    .set({ active: !active, updatedAt: new Date() })
    .where(
      and(
        eq(schema.bonos.id, id),
        eq(schema.bonos.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/bonos');
}

export async function deleteBonoAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  await db
    .delete(schema.bonos)
    .where(
      and(
        eq(schema.bonos.id, id),
        eq(schema.bonos.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/bonos');
}
