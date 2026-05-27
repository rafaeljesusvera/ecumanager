import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import {
  ArrowLeftIcon,
  ClipboardTextIcon,
  CalendarBlankIcon,
  ChatCircleTextIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge } from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

type CareItemDone = { key: string; done: boolean; notes?: string };

export default async function HorseOwnerDetailPage({
  params,
}: {
  params: Promise<{ horseId: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['horse_owner', 'owner', 'admin']);
  const { horseId } = await params;

  const [ownership] = await db
    .select({
      horseId: schema.horseOwners.horseId,
      role: schema.horseOwners.role,
    })
    .from(schema.horseOwners)
    .where(
      and(
        eq(schema.horseOwners.profileId, session.user.id),
        eq(schema.horseOwners.horseId, horseId),
      ),
    )
    .limit(1);
  if (!ownership && !['owner', 'admin'].includes(session.primary.role)) notFound();

  const [horse] = await db
    .select()
    .from(schema.horses)
    .where(eq(schema.horses.id, horseId))
    .limit(1);
  if (!horse) notFound();

  const careLogs = await db
    .select()
    .from(schema.horseCareLogs)
    .where(eq(schema.horseCareLogs.horseId, horseId))
    .orderBy(desc(schema.horseCareLogs.forDate))
    .limit(15);

  const rides = await db
    .select({
      id: schema.lessonAttendees.id,
      lessonDate: schema.lessons.date,
      discipline: schema.lessons.discipline,
      attended: schema.lessonAttendees.attended,
      riderName: schema.riders.name,
    })
    .from(schema.lessonAttendees)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonAttendees.lessonId))
    .innerJoin(schema.riders, eq(schema.riders.id, schema.lessonAttendees.riderId))
    .where(eq(schema.lessonAttendees.horseId, horseId))
    .orderBy(desc(schema.lessons.date))
    .limit(15);

  const reviews = await db
    .select({
      id: schema.horseReviews.id,
      rating: schema.horseReviews.rating,
      title: schema.horseReviews.title,
      body: schema.horseReviews.body,
      createdAt: schema.horseReviews.createdAt,
      riderName: schema.riders.name,
    })
    .from(schema.horseReviews)
    .innerJoin(schema.riders, eq(schema.riders.id, schema.horseReviews.riderId))
    .where(eq(schema.horseReviews.horseId, horseId))
    .orderBy(desc(schema.horseReviews.createdAt))
    .limit(10);

  return (
    <div className="p-6 md:p-10">
      <Link
        href="/app/horse-owner"
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
      >
        <ArrowLeftIcon size={12} weight="bold" /> Volver
      </Link>
      <PageHeader
        eyebrow={`${horse.kind} · ${horse.breed ?? '—'}`}
        title={horse.name}
        description={
          horse.notes ?? 'Agenda, cuidados y montura de tu caballo en la hípica.'
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Historial de cuidados" icon={<ClipboardTextIcon size={18} weight="duotone" />}>
          {careLogs.length === 0 ? (
            <p className="text-sm font-medium text-stone-500">
              Aún no hay checklists registrados.
            </p>
          ) : (
            <div className="space-y-2">
              {careLogs.map((c) => {
                const items = (c.itemsDone as CareItemDone[]) ?? [];
                const done = items.filter((i) => i.done).length;
                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-stone-900">
                        {formatDate(c.forDate)}
                      </div>
                      <Badge tone={done === items.length ? 'success' : 'warn'}>
                        {done}/{items.length}
                      </Badge>
                    </div>
                    {c.notes && (
                      <p className="mt-1 text-xs font-medium text-stone-600">
                        {c.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Historial de montura" icon={<CalendarBlankIcon size={18} weight="duotone" />}>
          {rides.length === 0 ? (
            <p className="text-sm font-medium text-stone-500">
              Tu caballo aún no ha participado en clases registradas.
            </p>
          ) : (
            <div className="space-y-2">
              {rides.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-stone-900">
                      {r.riderName}
                    </div>
                    <Badge tone={r.attended ? 'success' : 'neutral'}>
                      {r.attended ? 'realizada' : 'programada'}
                    </Badge>
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    {r.discipline} · {formatDateTime(r.lessonDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="mt-6">
        <Card title="Opiniones de jinetes" icon={<ChatCircleTextIcon size={18} weight="duotone" />}>
          {reviews.length === 0 ? (
            <p className="text-sm font-medium text-stone-500">
              Sin opiniones por ahora. Cuando los alumnos publiquen su
              experiencia, la verás aquí.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-stone-900">
                      {r.riderName}
                    </div>
                    <div className="text-xs font-bold text-brand-700">
                      {'★'.repeat(r.rating)}
                      {'☆'.repeat(5 - r.rating)}
                    </div>
                  </div>
                  {r.title && (
                    <div className="text-xs font-bold text-stone-900">
                      {r.title}
                    </div>
                  )}
                  {r.body && (
                    <p className="mt-1 text-xs font-medium text-stone-600">
                      {r.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2 text-brand-700">
        {icon}
        <h2 className="text-base font-bold text-stone-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}
