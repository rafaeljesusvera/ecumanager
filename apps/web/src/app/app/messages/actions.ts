'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq, inArray, sql } from 'drizzle-orm';

import { ensureSession } from '@/lib/db';

/**
 * Empieza (o reutiliza) un hilo directo con otro usuario y envía un mensaje.
 */
export async function startDirectThreadAction(formData: FormData) {
  const session = await ensureSession();
  const recipientId = String(formData.get('recipientId') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (!recipientId || !body || recipientId === session.user.id) return;

  // Buscar hilo existente: ambos participantes y kind=direct.
  const existing = await db.execute(sql`
    select t.id from message_threads t
    join thread_participants p1 on p1.thread_id = t.id and p1.profile_id = ${session.user.id}
    join thread_participants p2 on p2.thread_id = t.id and p2.profile_id = ${recipientId}
    where t.kind = 'direct'
    limit 1
  `) as unknown as { rows?: Array<{ id: string }> } | Array<{ id: string }>;
  const rows = Array.isArray(existing) ? existing : existing.rows ?? [];

  let threadId = rows[0]?.id;

  if (!threadId) {
    const [t] = await db
      .insert(schema.messageThreads)
      .values({
        kind: 'direct',
        createdBy: session.user.id,
      })
      .returning();
    threadId = t!.id;
    await db.insert(schema.threadParticipants).values([
      { threadId, profileId: session.user.id },
      { threadId, profileId: recipientId },
    ]);
  }

  await db.insert(schema.messages).values({
    threadId,
    senderId: session.user.id,
    body,
  });

  await db
    .update(schema.messageThreads)
    .set({ lastMessageAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.messageThreads.id, threadId));

  await db.insert(schema.notifications).values({
    profileId: recipientId,
    clubId: session.primary.clubId,
    kind: 'sistema',
    title: 'Nuevo mensaje',
    body: body.slice(0, 140),
    link: `/app/messages/${threadId}`,
  });

  revalidatePath('/app/messages');
  redirect(`/app/messages/${threadId}`);
}

export async function sendMessageAction(formData: FormData) {
  const session = await ensureSession();
  const threadId = String(formData.get('threadId') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (!threadId || !body) return;

  const [me] = await db
    .select()
    .from(schema.threadParticipants)
    .where(
      and(
        eq(schema.threadParticipants.threadId, threadId),
        eq(schema.threadParticipants.profileId, session.user.id),
      ),
    )
    .limit(1);
  if (!me) redirect('/app/messages');

  await db.insert(schema.messages).values({
    threadId,
    senderId: session.user.id,
    body,
  });
  await db
    .update(schema.messageThreads)
    .set({ lastMessageAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.messageThreads.id, threadId));

  // Notificar al resto de participantes
  const others = await db
    .select({ profileId: schema.threadParticipants.profileId })
    .from(schema.threadParticipants)
    .where(eq(schema.threadParticipants.threadId, threadId));
  for (const o of others) {
    if (o.profileId === session.user.id) continue;
    await db.insert(schema.notifications).values({
      profileId: o.profileId,
      clubId: session.primary.clubId,
      kind: 'sistema',
      title: 'Nuevo mensaje',
      body: body.slice(0, 140),
      link: `/app/messages/${threadId}`,
    });
  }

  revalidatePath(`/app/messages/${threadId}`);
}
