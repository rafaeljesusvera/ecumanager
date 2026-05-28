import Image from 'next/image';
import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, desc, eq, gte } from 'drizzle-orm';
import {
  TrophyIcon,
  MapPinIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, EmptyState } from '@/components/ui';
import { formatCents, formatDateTime } from '@/lib/format';

export const metadata = { title: 'Eventos' };
export const dynamic = 'force-dynamic';

export default async function MeEventsPage() {
  const session = await ensureSession();
  assertRole(session, ['rider', 'owner', 'admin', 'instructor']);

  await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );

  const events = await db
    .select()
    .from(schema.events)
    .where(
      and(
        eq(schema.events.clubId, session.primary.clubId),
        eq(schema.events.status, 'publicado'),
        gte(schema.events.startsAt, new Date()),
      ),
    )
    .orderBy(desc(schema.events.startsAt));

  const myEnrollments = await db
    .select()
    .from(schema.enrollments)
    .where(
      and(
        eq(schema.enrollments.clubId, session.primary.clubId),
        eq(schema.enrollments.profileId, session.user.id),
        eq(schema.enrollments.targetType, 'evento'),
      ),
    );
  const enrolledIds = new Set(myEnrollments.map((e) => e.targetId));

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Alumno"
        title="Eventos abiertos"
        description="Competiciones, salidas y clinics organizados por tu hípica. Toca un evento para ver el detalle y apuntarte."
      />

      {events.length === 0 ? (
        <EmptyState
          icon={<TrophyIcon size={40} weight="duotone" />}
          title="No hay eventos publicados"
          description="Cuando tu hípica publique uno, lo verás aquí."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {events.map((e) => {
            const enrolled = enrolledIds.has(e.id);
            return (
              <Link
                key={e.id}
                href={`/app/me/events/${e.id}` as never}
                className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
              >
                {e.photoUrl && (
                  <div className="relative aspect-[16/9] w-full bg-stone-100">
                    <Image
                      src={e.photoUrl}
                      alt={e.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                        {e.kind.replace('_', ' ')}
                      </p>
                      <h3 className="text-base font-bold text-stone-900">
                        {e.title}
                      </h3>
                    </div>
                    {enrolled && (
                      <Badge tone="success">
                        <CheckCircleIcon size={11} weight="bold" /> Apuntado
                      </Badge>
                    )}
                  </div>
                  {e.description && (
                    <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-stone-600">
                      {e.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="brand">{formatDateTime(e.startsAt)}</Badge>
                    {e.location && (
                      <Badge tone="neutral">
                        <MapPinIcon size={10} weight="bold" /> {e.location}
                      </Badge>
                    )}
                    <Badge tone="info">{formatCents(e.priceCents)}</Badge>
                  </div>
                  <div className="mt-auto flex items-center justify-end pt-4 text-stone-300 group-hover:text-brand-600">
                    <ArrowRightIcon size={16} weight="bold" />
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
