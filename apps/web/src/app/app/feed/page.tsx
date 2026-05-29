import { db, schema } from '@equmanager/database';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import {
  HeartIcon,
  SparkleIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Avatar, EmptyState } from '@/components/ui';
import { Composer } from './Composer';
import { LikeButton } from './LikeButton';
import { Suggestions } from './Suggestions';

export const metadata = { title: 'Feed' };
export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const session = await ensureSession();

  // Conexiones aceptadas (en cualquier dirección)
  const myConnections = await db
    .select({
      requester: schema.connections.requesterId,
      recipient: schema.connections.recipientId,
    })
    .from(schema.connections)
    .where(
      and(
        eq(schema.connections.status, 'aceptada'),
        or(
          eq(schema.connections.requesterId, session.user.id),
          eq(schema.connections.recipientId, session.user.id),
        ),
      ),
    );
  const friendIds = new Set<string>();
  for (const c of myConnections) {
    friendIds.add(c.requester === session.user.id ? c.recipient : c.requester);
  }
  friendIds.add(session.user.id);

  // Posts del feed: míos + de conexiones aceptadas
  const authors = Array.from(friendIds);
  const posts =
    authors.length === 0
      ? []
      : await db
          .select({
            id: schema.socialPosts.id,
            body: schema.socialPosts.body,
            photoUrl: schema.socialPosts.photoUrl,
            createdAt: schema.socialPosts.createdAt,
            authorId: schema.socialPosts.authorId,
            authorName: schema.profiles.fullName,
            authorAvatar: schema.profiles.avatarUrl,
            likes: sql<number>`(
              select count(*)::int from social_likes l
              where l.post_id = ${schema.socialPosts.id}
            )`,
            iLiked: sql<boolean>`exists(
              select 1 from social_likes l
              where l.post_id = ${schema.socialPosts.id}
                and l.profile_id = ${session.user.id}
            )`,
          })
          .from(schema.socialPosts)
          .innerJoin(
            schema.profiles,
            eq(schema.profiles.id, schema.socialPosts.authorId),
          )
          .where(inArray(schema.socialPosts.authorId, authors))
          .orderBy(desc(schema.socialPosts.createdAt))
          .limit(50);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Comunidad"
        title="Feed"
        description="Lo que están haciendo tus contactos y tu hípica. Comparte una foto con un toque."
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <Composer />
          {posts.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={<SparkleIcon size={36} weight="duotone" />}
                title="Tu feed está vacío"
                description="Conecta con otros alumnos desde el panel lateral y empieza a compartir."
              />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {posts.map((p) => (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card"
                >
                  <header className="flex items-center gap-3 px-4 py-3">
                    <Avatar
                      name={p.authorName ?? '—'}
                      src={p.authorAvatar}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-stone-900">
                        {p.authorName ?? 'Anónimo'}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        {new Date(p.createdAt).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </header>
                  {p.photoUrl && (
                    <div className="relative aspect-video bg-stone-100">
                      <img
                        src={p.photoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="px-4 py-3 text-sm font-medium text-stone-800">
                    {p.body}
                  </div>
                  <footer className="flex items-center gap-3 border-t border-stone-100 px-4 py-2.5">
                    <LikeButton
                      postId={p.id}
                      initialLikes={p.likes}
                      initialLiked={p.iLiked}
                    />
                  </footer>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <Suggestions ownerId={session.user.id} />
        </aside>
      </div>
    </div>
  );
}
