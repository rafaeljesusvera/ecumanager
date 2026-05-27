'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import {
  EVENT_KINDS,
  EVENT_STATUSES,
  type EventKind,
  type EventStatus,
} from '@equmanager/domain';

import { ensureSession } from '@/lib/db';
import { parseEurosToCents } from '@/lib/format';

async function assertStaff() {
  const session = await ensureSession();
  if (!['owner', 'admin', 'instructor'].includes(session.primary.role)) {
    redirect('/app');
  }
  return session;
}

export async function createEventAction(formData: FormData) {
  const session = await assertStaff();
  const title = String(formData.get('title') ?? '').trim();
  const kind = (formData.get('kind') ?? 'otros') as EventKind;
  const location = String(formData.get('location') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const startsAt = new Date(String(formData.get('startsAt')));
  const priceCents = parseEurosToCents(String(formData.get('price')));
  const maxAttendees = Number(formData.get('maxAttendees')) || null;

  if (!title || Number.isNaN(startsAt.getTime()) || !EVENT_KINDS.includes(kind))
    return;

  await db.insert(schema.events).values({
    clubId: session.primary.clubId,
    title,
    kind,
    description,
    location,
    startsAt,
    priceCents,
    maxAttendees,
    status: 'publicado',
    createdBy: session.user.id,
  });
  revalidatePath('/app/events');
}

export async function updateEventStatusAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  const status = (formData.get('status') ?? 'publicado') as EventStatus;
  if (!EVENT_STATUSES.includes(status)) return;
  await db
    .update(schema.events)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(schema.events.id, id),
        eq(schema.events.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/events');
}

export async function deleteEventAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  await db
    .delete(schema.events)
    .where(
      and(
        eq(schema.events.id, id),
        eq(schema.events.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/events');
}
