'use server';

import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import {
  createAdminClient,
  createServerClient,
  getCurrentUser,
} from '@equmanager/auth';

import { setImpersonationFlag } from '@/lib/impersonation';
import { clearActiveProfile } from '@/lib/active-profile';

/**
 * Superadmin entra como otro usuario para ver Equmanager exactamente como
 * lo ve esa persona. Guarda en cookie el email original para poder volver
 * desde el banner que pinta /app/layout.
 */
export async function impersonateUserAction(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect('/login');

  const [meProfile] = await db
    .select({ isSuperadmin: schema.profiles.isSuperadmin })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, me.id))
    .limit(1);
  if (!meProfile?.isSuperadmin) {
    redirect('/app');
  }

  const targetProfileId = String(formData.get('profileId') ?? '').trim();
  if (!targetProfileId || targetProfileId === me.id) {
    redirect('/admin/users?error=' + encodeURIComponent('Usuario no válido'));
  }

  const [target] = await db
    .select({
      id: schema.profiles.id,
      email: schema.profiles.email,
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, targetProfileId))
    .limit(1);
  if (!target?.email) {
    redirect(
      '/admin/users?error=' +
        encodeURIComponent('No se encontró email del usuario.'),
    );
  }

  const adminEmail = me.email ?? '';
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: target.email,
  });
  if (error || !data?.properties?.hashed_token) {
    redirect(
      '/admin/users?error=' +
        encodeURIComponent(
          error?.message ?? 'No se pudo iniciar la impersonación.',
        ),
    );
  }

  const supabase = await createServerClient();
  await supabase.auth.signOut();
  await clearActiveProfile();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: 'magiclink',
  });
  if (verifyError) {
    redirect('/login?error=' + encodeURIComponent(verifyError.message));
  }

  if (adminEmail) {
    await setImpersonationFlag(adminEmail);
  }
  redirect('/app');
}
