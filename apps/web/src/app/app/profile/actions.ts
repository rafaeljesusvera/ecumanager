'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import {
  createAdminClient,
  createServerClient,
  getCurrentUser,
} from '@equmanager/auth';

/**
 * Actualiza el profile del usuario actual y, si tiene rider asociados
 * en sus clubes, también los sincroniza (nombre/email/foto).
 */
export async function updateProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const fullName = String(formData.get('fullName') ?? '').trim();
  const avatarUrl = String(formData.get('avatarUrl') ?? '').trim() || null;
  const phone = String(formData.get('phone') ?? '').trim() || null;

  if (!fullName) return;

  await db
    .update(schema.profiles)
    .set({
      fullName,
      avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(schema.profiles.id, user.id));

  // Sincroniza con los riders del usuario (mismo nombre, mismo teléfono,
  // misma foto). El email del rider es independiente: lo dejamos.
  await db
    .update(schema.riders)
    .set({
      name: fullName,
      photoUrl: avatarUrl,
      phone,
      updatedAt: new Date(),
    })
    .where(eq(schema.riders.profileId, user.id));

  revalidatePath('/app/profile');
  revalidatePath('/app/me');
  revalidatePath('/app');
}

/**
 * Cambia el email del usuario. Usa la service role key porque hace falta
 * actualizar también auth.users (la sesión sigue activa con cookie).
 */
export async function updateEmailAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  if (!email || !email.includes('@')) {
    redirect('/app/profile?error=' + encodeURIComponent('Email inválido'));
  }
  if (email === user.email) {
    redirect('/app/profile');
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email,
    email_confirm: true,
  });
  if (error) {
    redirect('/app/profile?error=' + encodeURIComponent(error.message));
  }

  await db
    .update(schema.profiles)
    .set({ email, updatedAt: new Date() })
    .where(eq(schema.profiles.id, user.id));

  revalidatePath('/app/profile');
  redirect('/app/profile?ok=email');
}

/**
 * Cambia la contraseña del usuario actual. Reuso del cliente SSR con la
 * sesión actual, que pide la contraseña nueva sin necesidad de la antigua
 * (el usuario ya está logado).
 */
export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  if (password.length < 8) {
    redirect(
      '/app/profile?error=' +
        encodeURIComponent('La contraseña debe tener al menos 8 caracteres'),
    );
  }
  if (password !== confirm) {
    redirect(
      '/app/profile?error=' + encodeURIComponent('Las contraseñas no coinciden'),
    );
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect('/app/profile?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/app/profile');
  redirect('/app/profile?ok=password');
}
