'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import {
  HORSE_KINDS,
  HORSE_STATUSES,
  type HorseKind,
  type HorseStatus,
} from '@equmanager/domain';

import { ensureSession } from '@/lib/db';

async function assertStaff() {
  const session = await ensureSession();
  if (!['owner', 'admin', 'instructor'].includes(session.primary.role)) {
    redirect('/app');
  }
  return session;
}

export async function createHorseAction(formData: FormData) {
  const session = await assertStaff();
  const name = String(formData.get('name') ?? '').trim();
  const kind = (formData.get('kind') ?? 'caballo') as HorseKind;
  const breed = String(formData.get('breed') ?? '').trim() || null;
  const birthYear = Number(formData.get('birthYear')) || null;
  const color = String(formData.get('color') ?? '').trim() || null;

  if (!name || !HORSE_KINDS.includes(kind)) return;

  await db.insert(schema.horses).values({
    clubId: session.primary.clubId,
    name,
    kind,
    breed,
    birthYear,
    color,
  });
  revalidatePath('/app/horses');
}

export async function updateHorseStatusAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  const status = (formData.get('status') ?? 'activo') as HorseStatus;
  if (!HORSE_STATUSES.includes(status)) return;
  await db
    .update(schema.horses)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(schema.horses.id, id),
        eq(schema.horses.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/horses');
}

export async function deleteHorseAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  await db
    .delete(schema.horses)
    .where(
      and(
        eq(schema.horses.id, id),
        eq(schema.horses.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/horses');
}
