import Image from 'next/image';
import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  HorseIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, EmptyState } from '@/components/ui';

export const metadata = { title: 'Mis caballos' };
export const dynamic = 'force-dynamic';

export default async function MeHorsesPage() {
  const session = await ensureSession();
  assertRole(session, ['rider', 'owner', 'admin', 'instructor']);

  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );

  const rows = await db
    .select({
      horseId: schema.lessonAttendees.horseId,
      horseName: schema.horses.name,
      kind: schema.horses.kind,
      breed: schema.horses.breed,
      photoUrl: schema.horses.photoUrl,
      rides: sql<number>`count(*)::int`,
    })
    .from(schema.lessonAttendees)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonAttendees.lessonId))
    .innerJoin(schema.horses, eq(schema.horses.id, schema.lessonAttendees.horseId))
    .where(
      and(
        eq(schema.lessonAttendees.riderId, rider!.id),
        eq(schema.lessonAttendees.attended, true),
      ),
    )
    .groupBy(
      schema.lessonAttendees.horseId,
      schema.horses.name,
      schema.horses.kind,
      schema.horses.breed,
      schema.horses.photoUrl,
    )
    .orderBy(desc(sql`count(*)`));

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Alumno"
        title="Mis caballos"
        description="Los que has montado, ordenados por afinidad. Toca uno para opinar y ver el detalle."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<HorseIcon size={40} weight="duotone" />}
          title="Aún no has montado en clase"
          description="Cuando tu instructor te asigne un caballo en una clase realizada, aparecerá aquí."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((r) => {
            const affinity = Math.min(99, r.rides * 12);
            return (
              <Link
                key={r.horseId ?? ''}
                href={`/app/me/horses/${r.horseId}` as never}
                className="group flex items-center gap-3 overflow-hidden rounded-3xl border border-stone-200 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
              >
                {r.photoUrl ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                    <Image
                      src={r.photoUrl}
                      alt={r.horseName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <HorseIcon size={28} weight="duotone" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold text-stone-900">
                    {r.horseName}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    {r.kind}
                    {r.breed ? ` · ${r.breed}` : ''}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge tone="brand">afinidad {affinity}%</Badge>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      {r.rides} montura{r.rides !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <ArrowRightIcon
                  size={16}
                  className="shrink-0 text-stone-300 group-hover:text-brand-600"
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
