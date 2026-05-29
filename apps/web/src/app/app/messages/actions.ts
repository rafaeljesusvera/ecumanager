'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';

import type { ClubRole } from '@equmanager/domain';
import { ensureSession } from '@/lib/db';

type BroadcastAudience = 'riders' | 'horse_owners' | 'all';

const AUDIENCE_ROLES: Record<BroadcastAudience, ClubRole[] | null> = {
  riders: ['rider'],
  horse_owners: ['horse_owner'],
  all: null,
};

const AUDIENCE_LABEL: Record<BroadcastAudience, string> = {
  riders: 'Alumnos del centro',
  horse_owners: 'Propietarios',
  all: 'Todos los miembros',
};

function canSendBroadcast(senderRole: string, audience: BroadcastAudience) {
  if (senderRole === 'owner' || senderRole === 'admin') return true;
  if (senderRole === 'instructor' && audience === 'riders') return true;
  return false;
}

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

/**
 * Crea un anuncio (broadcast) dirigido a un segmento del club primario del
 * remitente. Solo se permite si el remitente tiene un rol con permiso para
 * enviar a esa audiencia.
 */
export async function createBroadcastAction(formData: FormData) {
  const session = await ensureSession();
  const audience = String(formData.get('audience') ?? '').trim() as BroadcastAudience;
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();

  if (!body) return;
  if (!['riders', 'horse_owners', 'all'].includes(audience)) return;
  if (!canSendBroadcast(session.primary.role, audience)) return;

  const clubId = session.primary.clubId;
  const allowedRoles = AUDIENCE_ROLES[audience];

  const recipientRows = await db
    .select({ profileId: schema.clubMembers.profileId })
    .from(schema.clubMembers)
    .where(
      allowedRoles
        ? and(
            eq(schema.clubMembers.clubId, clubId),
            inArray(schema.clubMembers.role, allowedRoles),
            ne(schema.clubMembers.profileId, session.user.id),
          )
        : and(
            eq(schema.clubMembers.clubId, clubId),
            ne(schema.clubMembers.profileId, session.user.id),
          ),
    );

  const recipientIds = Array.from(
    new Set(recipientRows.map((r) => r.profileId)),
  );
  if (recipientIds.length === 0) return;

  const threadTitle =
    title || `Anuncio · ${AUDIENCE_LABEL[audience]}`;

  const [thread] = await db
    .insert(schema.messageThreads)
    .values({
      clubId,
      kind: 'broadcast',
      title: threadTitle,
      createdBy: session.user.id,
      lastMessageAt: new Date(),
    })
    .returning();
  const threadId = thread!.id;

  await db.insert(schema.threadParticipants).values([
    { threadId, profileId: session.user.id },
    ...recipientIds.map((profileId) => ({ threadId, profileId })),
  ]);

  await db.insert(schema.messages).values({
    threadId,
    senderId: session.user.id,
    body,
  });

  await db.insert(schema.notifications).values(
    recipientIds.map((profileId) => ({
      profileId,
      clubId,
      kind: 'sistema' as const,
      title: `Anuncio: ${threadTitle}`,
      body: body.slice(0, 140),
      link: `/app/messages/${threadId}`,
    })),
  );

  revalidatePath('/app/messages');
  redirect(`/app/messages/${threadId}`);
}
