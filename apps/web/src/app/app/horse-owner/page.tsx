import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  HorseIcon,
  ClipboardTextIcon,
  CalendarBlankIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Mis caballos' };
export const dynamic = 'force-dynamic';

export default async function HorseOwnerPage() {
  const session = await ensureSession();
  assertRole(session, ['horse_owner', 'owner', 'admin']);

  const today = new Date().toISOString().slice(0, 10);

  const horses = await db
    .select({
      id: schema.horses.id,
      name: schema.horses.name,
      kind: schema.horses.kind,
      status: schema.horses.status,
      role: schema.horseOwners.role,
      todayLogs: sql<number>`(
        SELECT count(*)::int FROM horse_care_logs hcl
        WHERE hcl.horse_id = ${schema.horses.id} AND hcl.for_date = ${today}
      )`,
      lastRideAt: sql<Date | null>`(
        SELECT max(l.date) FROM lesson_attendees la
        JOIN lessons l ON l.id = la.lesson_id
        WHERE la.horse_id = ${schema.horses.id} AND la.attended = true
      )`,
    })
    .from(schema.horseOwners)
    .innerJoin(schema.horses, eq(schema.horses.id, schema.horseOwners.horseId))
    .where(
      and(
        eq(schema.horseOwners.profileId, session.user.id),
        eq(schema.horses.clubId, session.primary.clubId),
      ),
    )
    .orderBy(schema.horses.name);

  const allNotifications = await db
    .select()
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.profileId, session.user.id),
        eq(schema.notifications.kind, 'checklist'),
      ),
    )
    .orderBy(desc(schema.notifications.createdAt))
    .limit(6);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Propietario"
        title="Mis caballos"
        description="Aquí ves el estado de tus caballos en la hípica: cuidados del día, agenda y opiniones."
      />

      {horses.length === 0 ? (
        <EmptyState
          icon={<HorseIcon size={40} weight="duotone" />}
          title="Aún no hay caballos asignados a ti"
          description="Pide al propietario de la hípica que te marque como dueño de tu caballo. Una vez lo haga, aparecerá aquí."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {horses.map((h) => (
            <Link
              key={h.id}
              href={`/app/horse-owner/${h.id}`}
              className="group flex flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <HorseIcon size={24} weight="duotone" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                      {h.kind}
                    </p>
                    <h3 className="text-base font-bold text-stone-900">{h.name}</h3>
                  </div>
                </div>
                <Badge tone={h.role === 'owner' ? 'brand' : 'neutral'}>
                  {h.role}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {h.todayLogs > 0 ? (
                  <Badge tone="success">
                    <ClipboardTextIcon size={10} weight="bold" /> cuidados al día
                  </Badge>
                ) : (
                  <Badge tone="warn">checklist pendiente</Badge>
                )}
                {h.lastRideAt && (
                  <Badge tone="info">
                    <CalendarBlankIcon size={10} weight="bold" /> última montura{' '}
                    {formatDate(h.lastRideAt)}
                  </Badge>
                )}
              </div>

              <div className="mt-auto flex items-center justify-end pt-4 text-stone-300 group-hover:text-brand-600">
                <ArrowRightIcon size={16} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {allNotifications.length > 0 && (
        <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 text-base font-bold text-stone-900">
            Últimos checklists recibidos
          </h2>
          <div className="space-y-2">
            {allNotifications.map((n) => (
              <div
                key={n.id}
                className="rounded-xl border border-stone-200 bg-stone-50 p-3"
              >
                <div className="text-sm font-bold text-stone-900">{n.title}</div>
                {n.body && (
                  <p className="text-xs font-medium text-stone-600">{n.body}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
