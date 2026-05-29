'use server';

import { revalidatePath } from 'next/cache';
import { db, schema } from '@equmanager/database';
import { and, eq, or } from 'drizzle-orm';

import { ensureSession } from '@/lib/db';

export async function createPostAction(formData: FormData) {
  const session = await ensureSession();
  const body = String(formData.get('body') ?? '').trim();
  const photoUrl = String(formData.get('photoUrl') ?? '').trim() || null;
  if (!body) return;

  await db.insert(schema.socialPosts).values({
    authorId: session.user.id,
    clubId: session.primary.clubId,
    body,
    photoUrl,
  });
  revalidatePath('/app/feed');
}

export async function toggleLikeAction(formData: FormData) {
  const session = await ensureSession();
  const postId = String(formData.get('postId') ?? '').trim();
  if (!postId) return;

  const [existing] = await db
    .select()
    .from(schema.socialLikes)
    .where(
      and(
        eq(schema.socialLikes.postId, postId),
        eq(schema.socialLikes.profileId, session.user.id),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(schema.socialLikes)
      .where(eq(schema.socialLikes.id, existing.id));
  } else {
    await db.insert(schema.socialLikes).values({
      postId,
      profileId: session.user.id,
    });
  }
  revalidatePath('/app/feed');
}

export async function connectAction(formData: FormData) {
  const session = await ensureSession();
  const recipientId = String(formData.get('recipientId') ?? '').trim();
  if (!recipientId || recipientId === session.user.id) return;

  const [existing] = await db
    .select()
    .from(schema.connections)
    .where(
      or(
        and(
          eq(schema.connections.requesterId, session.user.id),
          eq(schema.connections.recipientId, recipientId),
        ),
        and(
          eq(schema.connections.requesterId, recipientId),
          eq(schema.connections.recipientId, session.user.id),
        ),
      ),
    )
    .limit(1);
  if (existing) return;

  await db.insert(schema.connections).values({
    requesterId: session.user.id,
    recipientId,
    status: 'pendiente',
  });

  await db.insert(schema.notifications).values({
    profileId: recipientId,
    clubId: session.primary.clubId,
    kind: 'sistema',
    title: 'Nueva solicitud de conexión',
    body: 'Alguien quiere conectar contigo en Equmanager',
    link: '/app/feed',
  });
  revalidatePath('/app/feed');
}

export async function acceptConnectionAction(formData: FormData) {
  const session = await ensureSession();
  const id = String(formData.get('connectionId') ?? '').trim();
  if (!id) return;
  await db
    .update(schema.connections)
    .set({ status: 'aceptada', updatedAt: new Date() })
    .where(
      and(
        eq(schema.connections.id, id),
        eq(schema.connections.recipientId, session.user.id),
      ),
    );
  revalidatePath('/app/feed');
}
