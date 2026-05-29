'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import { createAdminClient } from '@equmanager/auth';
import type { ClubRole } from '@equmanager/domain';

import { ensureSession } from '@/lib/db';

async function assertOwnerOrAdmin() {
  const session = await ensureSession();
  if (!['owner', 'admin'].includes(session.primary.role)) {
    redirect('/app');
  }
  return session;
}

/**
 * Da de alta un miembro del equipo:
 * - Si ya existe profile con ese email, le añade el club_member.
 * - Si no existe, crea el usuario en Supabase (sin contraseña, magic link)
 *   y luego ensure profile + club_member.
 */
export async function addStaffAction(formData: FormData) {
  const session = await assertOwnerOrAdmin();
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role = String(formData.get('role') ?? '') as ClubRole;

  if (!fullName || !email) {
    redirect(
      '/app/staff?error=' +
        encodeURIComponent('Faltan nombre o email'),
    );
  }
  if (!['groom', 'instructor', 'admin'].includes(role)) {
    redirect('/app/staff?error=' + encodeURIComponent('Rol no permitido'));
  }

  // ¿Existe ya un profile con ese email?
  const [existing] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.email, email))
    .limit(1);

  let profileId = existing?.id ?? null;

  if (!profileId) {
    // Crear usuario en Supabase con magic link (sin password fijo).
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
      });
      if (error) throw error;
      profileId = data.user?.id ?? null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error invitando usuario';
      redirect('/app/staff?error=' + encodeURIComponent(msg));
    }

    // Asegurar profile (el trigger debería crearlo, pero por si acaso)
    if (profileId) {
      const [created] = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.id, profileId))
        .limit(1);
      if (!created) {
        await db
          .insert(schema.profiles)
          .values({ id: profileId, email, fullName });
      }
    }
  }

  if (!profileId) {
    redirect(
      '/app/staff?error=' +
        encodeURIComponent('No se pudo crear el perfil'),
    );
  }

  // ¿Ya es miembro? Si lo es con otro rol, actualizamos.
  const [member] = await db
    .select()
    .from(schema.clubMembers)
    .where(
      and(
        eq(schema.clubMembers.clubId, session.primary.clubId),
        eq(schema.clubMembers.profileId, profileId),
      ),
    )
    .limit(1);

  if (!member) {
    await db.insert(schema.clubMembers).values({
      clubId: session.primary.clubId,
      profileId,
      role,
      invitedBy: session.user.id,
    });
  } else if (member.role !== role && member.role !== 'owner') {
    await db
      .update(schema.clubMembers)
      .set({ role })
      .where(eq(schema.clubMembers.id, member.id));
  }

  await db.insert(schema.notifications).values({
    profileId,
    clubId: session.primary.clubId,
    kind: 'sistema',
    title: `Te han añadido al equipo de ${session.primary.clubName}`,
    body: `Tu rol es: ${role}.`,
    link: '/app',
  });

  revalidatePath('/app/staff');
  redirect(
    '/app/staff?message=' +
      encodeURIComponent(`${fullName} añadido al equipo.`),
  );
}

export async function updateStaffRoleAction(formData: FormData) {
  const session = await assertOwnerOrAdmin();
  const memberId = String(formData.get('memberId') ?? '');
  const role = String(formData.get('role') ?? '') as ClubRole;
  if (!['groom', 'instructor', 'admin'].includes(role)) {
    redirect('/app/staff?error=' + encodeURIComponent('Rol no permitido'));
  }

  const [member] = await db
    .select()
    .from(schema.clubMembers)
    .where(
      and(
        eq(schema.clubMembers.id, memberId),
        eq(schema.clubMembers.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!member || member.role === 'owner') {
    redirect('/app/staff?error=' + encodeURIComponent('Miembro no válido'));
  }

  await db
    .update(schema.clubMembers)
    .set({ role })
    .where(eq(schema.clubMembers.id, memberId));
  revalidatePath('/app/staff');
}

export async function removeStaffAction(formData: FormData) {
  const session = await assertOwnerOrAdmin();
  const memberId = String(formData.get('memberId') ?? '');

  const [member] = await db
    .select()
    .from(schema.clubMembers)
    .where(
      and(
        eq(schema.clubMembers.id, memberId),
        eq(schema.clubMembers.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!member || member.role === 'owner') {
    redirect('/app/staff?error=' + encodeURIComponent('Miembro no válido'));
  }
  await db
    .delete(schema.clubMembers)
    .where(eq(schema.clubMembers.id, memberId));
  revalidatePath('/app/staff');
}
