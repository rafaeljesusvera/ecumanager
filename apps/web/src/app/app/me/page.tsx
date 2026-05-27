import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import {
  CalendarBlankIcon,
  HorseIcon,
  MedalIcon,
  ChatCircleTextIcon,
  TrophyIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, EmptyState } from '@/components/ui';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Mi panel' };
export const dynamic = 'force-dynamic';

export default async function MePage() {
  const session = await ensureSession();
  assertRole(session, ['rider', 'owner', 'admin', 'instructor']);

  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );

  const now = new Date();

  const upcoming = await db
    .select({
      attendeeId: schema.lessonAttendees.id,
      lessonId: schema.lessons.id,
      date: schema.lessons.date,
      discipline: schema.lessons.discipline,
      horseName: schema.horses.name,
    })
    .from(schema.lessonAttendees)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonAttendees.lessonId))
    .leftJoin(schema.horses, eq(schema.horses.id, schema.lessonAttendees.horseId))
    .where(
      and(
        eq(schema.lessonAttendees.riderId, rider!.id),
        gte(schema.lessons.date, now),
      ),
    )
    .orderBy(schema.lessons.date)
    .limit(5);

  const lastFeedback = await db
    .select({
      id: schema.lessonFeedback.id,
      body: schema.lessonFeedback.body,
      source: schema.lessonFeedback.source,
      createdAt: schema.lessonFeedback.createdAt,
      lessonDate: schema.lessons.date,
    })
    .from(schema.lessonFeedback)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonFeedback.lessonId))
    .where(eq(schema.lessonFeedback.riderId, rider!.id))
    .orderBy(desc(schema.lessonFeedback.createdAt))
    .limit(3);

  const [badgeCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.riderBadges)
    .where(eq(schema.riderBadges.riderId, rider!.id));

  const [horseCount] = await db
    .select({
      n: sql<number>`count(DISTINCT ${schema.lessonAttendees.horseId})::int`,
    })
    .from(schema.lessonAttendees)
    .where(
      and(
        eq(schema.lessonAttendees.riderId, rider!.id),
        eq(schema.lessonAttendees.attended, true),
      ),
    );

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow={`Alumno · ${rider!.category} · ${rider!.tier}`}
        title={rider!.name}
        description={`${session.primary.clubName} — todo lo que has hecho y lo que viene.`}
      />

      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi
          icon={<CalendarBlankIcon size={20} weight="duotone" />}
          label="Próximas clases"
          value={upcoming.length}
          href="/app/me/lessons"
        />
        <Kpi
          icon={<HorseIcon size={20} weight="duotone" />}
          label="Caballos montados"
          value={horseCount?.n ?? 0}
          href="/app/me/horses"
        />
        <Kpi
          icon={<MedalIcon size={20} weight="duotone" />}
          label="Insignias"
          value={badgeCount?.n ?? 0}
          href="/app/me/badges"
        />
        <Kpi
          icon={<TrophyIcon size={20} weight="duotone" />}
          label="Eventos abiertos"
          value={0}
          href="/app/me/events"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">Tus próximas clases</h2>
            <Link
              href="/app/me/lessons"
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700 hover:text-brand-900"
            >
              Ver todas
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState
              title="Sin clases todavía"
              description="Pide a tu instructor que te asigne a una clase. Aparecerá aquí al instante."
            />
          ) : (
            <div className="space-y-2">
              {upcoming.map((u) => (
                <div
                  key={u.attendeeId}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3"
                >
                  <div>
                    <div className="text-sm font-bold text-stone-900">
                      {formatDateTime(u.date)}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                      {u.discipline}
                      {u.horseName ? ` · ${u.horseName}` : ' · caballo por asignar'}
                    </div>
                  </div>
                  {u.horseName && <Badge tone="brand">{u.horseName}</Badge>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">Comentarios recientes</h2>
            <ChatCircleTextIcon size={18} weight="duotone" className="text-brand-700" />
          </div>
          {lastFeedback.length === 0 ? (
            <p className="text-sm font-medium text-stone-500">
              Cuando tu instructor publique feedback, aparecerá aquí. Si usa la
              IA, será inmediato después de cada clase.
            </p>
          ) : (
            <div className="space-y-3">
              {lastFeedback.map((f) => (
                <div
                  key={f.id}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                      Clase del {formatDateTime(f.lessonDate)}
                    </div>
                    {f.source === 'ia' && <Badge tone="info">IA</Badge>}
                  </div>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-stone-800">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {label}
        </div>
        <div className="text-2xl font-bold text-stone-900">{value}</div>
      </div>
      <ArrowRightIcon size={14} className="text-stone-300 group-hover:text-brand-600" />
    </Link>
  );
}
