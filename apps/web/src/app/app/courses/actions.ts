'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import { COURSE_STATUSES, type CourseStatus } from '@equmanager/domain';

import { ensureSession } from '@/lib/db';
import { parseEurosToCents } from '@/lib/format';

async function assertStaff() {
  const session = await ensureSession();
  if (!['owner', 'admin', 'instructor'].includes(session.primary.role)) {
    redirect('/app');
  }
  return session;
}

export async function createCourseAction(formData: FormData) {
  const session = await assertStaff();
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const discipline = String(formData.get('discipline') ?? 'iniciacion');
  const startDate = formData.get('startDate')
    ? new Date(String(formData.get('startDate')))
    : null;
  const endDate = formData.get('endDate')
    ? new Date(String(formData.get('endDate')))
    : null;
  const priceCents = parseEurosToCents(String(formData.get('price')));
  const maxStudents = Number(formData.get('maxStudents')) || null;

  if (!title) return;

  await db.insert(schema.courses).values({
    clubId: session.primary.clubId,
    title,
    description,
    discipline,
    startDate,
    endDate,
    priceCents,
    maxStudents,
    status: 'publicado',
    createdBy: session.user.id,
  });
  revalidatePath('/app/courses');
}

export async function updateCourseStatusAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  const status = (formData.get('status') ?? 'publicado') as CourseStatus;
  if (!COURSE_STATUSES.includes(status)) return;
  await db
    .update(schema.courses)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(schema.courses.id, id),
        eq(schema.courses.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/courses');
}

export async function deleteCourseAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  await db
    .delete(schema.courses)
    .where(
      and(
        eq(schema.courses.id, id),
        eq(schema.courses.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/courses');
}
