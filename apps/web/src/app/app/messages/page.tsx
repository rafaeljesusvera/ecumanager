import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, desc, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm';
import {
  ChatCircleIcon,
  PlusIcon,
  PaperPlaneTiltIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Avatar, Button, EmptyState } from '@/components/ui';
import { NewThreadDialog } from './NewThreadDialog';

export const metadata = { title: 'Mensajes' };
export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const session = await ensureSession();

  // Hilos en los que participo
  const myThreads = await db
    .select({
      threadId: schema.threadParticipants.threadId,
      lastReadAt: schema.threadParticipants.lastReadAt,
    })
    .from(schema.threadParticipants)
    .where(eq(schema.threadParticipants.profileId, session.user.id));

  const threadIds = myThreads.map((t) => t.threadId);

  const threads =
    threadIds.length === 0
      ? []
      : await db
          .select({
            id: schema.messageThreads.id,
            kind: schema.messageThreads.kind,
            title: schema.messageThreads.title,
            lastMessageAt: schema.messageThreads.lastMessageAt,
            updatedAt: schema.messageThreads.updatedAt,
          })
          .from(schema.messageThreads)
          .where(inArray(schema.messageThreads.id, threadIds))
          .orderBy(desc(schema.messageThreads.lastMessageAt));

  // Último mensaje + contadores
  const lastMessages =
    threadIds.length === 0
      ? []
      : await db
          .select({
            threadId: schema.messages.threadId,
            body: schema.messages.body,
            createdAt: schema.messages.createdAt,
            senderId: schema.messages.senderId,
            senderName: schema.profiles.fullName,
            senderAvatar: schema.profiles.avatarUrl,
          })
          .from(schema.messages)
          .leftJoin(
            schema.profiles,
            eq(schema.profiles.id, schema.messages.senderId),
          )
          .where(inArray(schema.messages.threadId, threadIds))
          .orderBy(desc(schema.messages.createdAt));

  const lastByThread = new Map<string, (typeof lastMessages)[number]>();
  for (const m of lastMessages) {
    if (!lastByThread.has(m.threadId)) lastByThread.set(m.threadId, m);
  }

  // Otros participantes (para mostrar nombres en hilos directos)
  const otherParticipants =
    threadIds.length === 0
      ? []
      : await db
          .select({
            threadId: schema.threadParticipants.threadId,
            profileId: schema.profiles.id,
            fullName: schema.profiles.fullName,
            email: schema.profiles.email,
            avatarUrl: schema.profiles.avatarUrl,
          })
          .from(schema.threadParticipants)
          .innerJoin(
            schema.profiles,
            eq(schema.profiles.id, schema.threadParticipants.profileId),
          )
          .where(
            and(
              inArray(schema.threadParticipants.threadId, threadIds),
              ne(schema.threadParticipants.profileId, session.user.id),
            ),
          );

  const othersByThread = new Map<string, typeof otherParticipants>();
  for (const p of otherParticipants) {
    const arr = othersByThread.get(p.threadId) ?? [];
    arr.push(p);
    othersByThread.set(p.threadId, arr);
  }

  // Posibles destinatarios: cualquier persona de mis clubes
  const myClubIds = session.memberships.map((m) => m.clubId);
  const peers =
    myClubIds.length === 0
      ? []
      : await db
          .select({
            id: schema.profiles.id,
            fullName: schema.profiles.fullName,
            email: schema.profiles.email,
            avatarUrl: schema.profiles.avatarUrl,
            clubName: schema.clubs.name,
            role: schema.clubMembers.role,
          })
          .from(schema.clubMembers)
          .innerJoin(
            schema.profiles,
            eq(schema.profiles.id, schema.clubMembers.profileId),
          )
          .innerJoin(
            schema.clubs,
            eq(schema.clubs.id, schema.clubMembers.clubId),
          )
          .where(
            and(
              inArray(schema.clubMembers.clubId, myClubIds),
              ne(schema.clubMembers.profileId, session.user.id),
            ),
          );

  const uniquePeers = Array.from(
    new Map(peers.map((p) => [p.id, p])).values(),
  );

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Comunidad"
        title="Mensajes"
        description="Habla con tu instructor, tu mozo o tu propietario. Crea anuncios para todo tu grupo de un toque."
      />

      <div className="mt-6 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {threads.length} conversaciones
        </span>
        <NewThreadDialog peers={uniquePeers} />
      </div>

      {threads.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<ChatCircleIcon size={40} weight="duotone" />}
            title="Aún no hay conversaciones"
            description="Empieza una con el botón “Nuevo mensaje”."
          />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
          {threads.map((t) => {
            const last = lastByThread.get(t.id);
            const others = othersByThread.get(t.id) ?? [];
            const isBroadcast = t.kind === 'broadcast';
            const display =
              t.title ??
              (isBroadcast
                ? 'Anuncio del centro'
                : others
                    .map((o) => o.fullName ?? o.email)
                    .join(', '));
            return (
              <Link
                key={t.id}
                href={`/app/messages/${t.id}`}
                className="flex items-start gap-3 border-b border-stone-100 px-4 py-3 transition last:border-b-0 hover:bg-stone-50"
              >
                <Avatar
                  name={display}
                  src={others[0]?.avatarUrl ?? null}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-bold text-stone-900">
                      {display}
                    </div>
                    <div className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      {(t.lastMessageAt ?? t.updatedAt)
                        ? new Date(
                            (t.lastMessageAt ?? t.updatedAt) as Date,
                          ).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                          })
                        : ''}
                    </div>
                  </div>
                  <div className="mt-0.5 truncate text-xs font-medium text-stone-600">
                    {last?.body ?? 'Sin mensajes aún'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
