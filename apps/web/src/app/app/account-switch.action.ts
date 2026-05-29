'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@equmanager/auth';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';

import {
  setActiveProfile,
  clearActiveProfile,
} from '@/lib/active-profile';

/**
 * Cambia el "perfil activo" del usuario logueado al de uno de sus
 * vínculos. Valida que el vínculo exista, esté activo y pertenezca al
 * usuario actual antes de tocar la cookie.
 *
 * Si `linkId` es null/vacío, vuelve a la cuenta propia (self).
 */
export async function switchAccount(linkId: string | null) {
  const user = await getCurrentUser();
  if (!user) throw new Error('No autenticado.');

  if (!linkId) {
    await clearActiveProfile();
    revalidatePath('/app', 'layout');
    return { ok: true as const };
  }

  const [link] = await db
    .select()
    .from(schema.profileLinks)
    .where(
      and(
        eq(schema.profileLinks.id, linkId),
        eq(schema.profileLinks.ownerProfileId, user.id),
        eq(schema.profileLinks.status, 'activa'),
      ),
    )
    .limit(1);

  if (!link) {
    throw new Error('Vínculo no encontrado o sin permiso.');
  }

  if (link.targetProfileId) {
    await setActiveProfile({
      kind: 'profile',
      profileId: link.targetProfileId,
    });
  } else if (link.riderId) {
    await setActiveProfile({ kind: 'rider', riderId: link.riderId });
  } else {
    throw new Error('Vínculo sin destino válido.');
  }

  revalidatePath('/app', 'layout');
  return { ok: true as const };
}
