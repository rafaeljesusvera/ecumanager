'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';

import { ensureSession } from '@/lib/db';

/**
 * El alumno se apunta a un curso publicado de su club.
 * - Verifica que el curso exista, esté publicado y pertenezca a su club.
 * - Si ya hay un enrollment del mismo profile+curso, no duplica.
 * - Estado inicial "pendiente" (el club confirma o pasa a lista_espera).
 */
export async function enrollInCourseAction(formData: FormData) {
  const session = await ensureSession();
  const courseId = String(formData.get('courseId') ?? '').trim();
  const riderId = String(formData.get('riderId') ?? '').trim() || null;

  if (!courseId) {
    redirect(
      '/app/me/courses?error=' +
        encodeURIComponent('Curso no válido.'),
    );
  }

  const [course] = await db
    .select()
    .from(schema.courses)
    .where(
      and(
        eq(schema.courses.id, courseId),
        eq(schema.courses.clubId, session.primary.clubId),
        eq(schema.courses.status, 'publicado'),
      ),
    )
    .limit(1);

  if (!course) {
    redirect(
      '/app/me/courses?error=' +
        encodeURIComponent('El curso ya no está disponible.'),
    );
  }

  const [existing] = await db
    .select()
    .from(schema.enrollments)
    .where(
      and(
        eq(schema.enrollments.clubId, session.primary.clubId),
        eq(schema.enrollments.profileId, session.user.id),
        eq(schema.enrollments.targetType, 'curso'),
        eq(schema.enrollments.targetId, courseId),
      ),
    )
    .limit(1);

  if (existing) {
    redirect(
      '/app/me/courses?message=' +
        encodeURIComponent('Ya estabas apuntado a este curso.'),
    );
  }

  await db.insert(schema.enrollments).values({
    clubId: session.primary.clubId,
    profileId: session.user.id,
    riderId,
    targetType: 'curso',
    targetId: courseId,
    status: 'pendiente',
  });

  // Notificación al alumno
  await db.insert(schema.notifications).values({
    profileId: session.user.id,
    clubId: session.primary.clubId,
    kind: 'inscripcion',
    title: `Solicitud enviada: ${course.title}`,
    body: 'Tu hípica revisará tu inscripción y te confirmará la plaza.',
    link: '/app/me/courses',
  });

  revalidatePath('/app/me/courses');
  redirect(
    '/app/me/courses?message=' +
      encodeURIComponent(
        '¡Solicitud enviada! Te avisaremos cuando confirmen tu plaza.',
      ),
  );
}
