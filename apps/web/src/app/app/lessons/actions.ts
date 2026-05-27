'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import {
  DISCIPLINES,
  LESSON_STATUSES,
  type Discipline,
  type LessonStatus,
} from '@equmanager/domain';

import { ensureSession } from '@/lib/db';

async function assertStaff() {
  const session = await ensureSession();
  if (!['owner', 'admin', 'instructor'].includes(session.primary.role)) {
    redirect('/app');
  }
  return session;
}

export async function createLessonAction(formData: FormData) {
  const session = await assertStaff();
  const date = new Date(String(formData.get('date')));
  const durationMinutes = Number(formData.get('duration')) || 60;
  const discipline = (formData.get('discipline') ?? 'iniciacion') as Discipline;
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (Number.isNaN(date.getTime()) || !DISCIPLINES.includes(discipline)) return;

  await db.insert(schema.lessons).values({
    clubId: session.primary.clubId,
    instructorId: session.user.id,
    date,
    durationMinutes,
    discipline,
    notes,
  });
  revalidatePath('/app/lessons');
}

export async function updateLessonStatusAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  const status = (formData.get('status') ?? 'programada') as LessonStatus;
  if (!LESSON_STATUSES.includes(status)) return;
  await db
    .update(schema.lessons)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(schema.lessons.id, id),
        eq(schema.lessons.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/lessons');
}

export async function deleteLessonAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  await db
    .delete(schema.lessons)
    .where(
      and(
        eq(schema.lessons.id, id),
        eq(schema.lessons.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/lessons');
}

export async function addAttendeeAction(formData: FormData) {
  await assertStaff();
  const lessonId = String(formData.get('lessonId'));
  const riderId = String(formData.get('riderId'));
  const horseId = String(formData.get('horseId') ?? '');

  if (!lessonId || !riderId) return;

  await db
    .insert(schema.lessonAttendees)
    .values({
      lessonId,
      riderId,
      horseId: horseId || null,
    })
    .onConflictDoNothing();

  revalidatePath('/app/lessons');
}

export async function removeAttendeeAction(formData: FormData) {
  await assertStaff();
  const id = String(formData.get('id'));
  await db
    .delete(schema.lessonAttendees)
    .where(eq(schema.lessonAttendees.id, id));
  revalidatePath('/app/lessons');
}
