'use server';

import { revalidatePath } from 'next/cache';
import { db, schema } from '@equmanager/database';
import { and, eq, isNull } from 'drizzle-orm';

import { ensureSession } from '@/lib/db';

export async function markAllReadAction() {
  const session = await ensureSession();
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.profileId, session.user.id),
        isNull(schema.notifications.readAt),
      ),
    );
  revalidatePath('/app/notifications');
  revalidatePath('/app');
}

export async function markOneReadAction(formData: FormData) {
  const session = await ensureSession();
  const id = String(formData.get('id'));
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.id, id),
        eq(schema.notifications.profileId, session.user.id),
      ),
    );
  revalidatePath('/app/notifications');
}
