import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import {
  HorseIcon,
  GraduationCapIcon,
  CalendarBlankIcon,
  TrophyIcon,
  TicketIcon,
  NewspaperIcon,
  ClipboardTextIcon,
  CertificateIcon,
  MicrophoneStageIcon,
  BookOpenTextIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, roleLabel } from '@/lib/db';

export const metadata = { title: 'Inicio' };
export const dynamic = 'force-dynamic';

export default async function AppHome() {
  const session = await ensureSession();
  const { primary, user, memberships } = session;
  const roles = Array.from(new Set(memberships.map((m) => m.role)));

  const [horseCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.horses)
    .where(eq(schema.horses.clubId, primary.clubId));

  const [riderCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.riders)
    .where(eq(schema.riders.clubId, primary.clubId));

  const now = new Date();
  const upcomingLessons = await db
    .select({
      id: schema.lessons.id,
      date: schema.lessons.date,
      discipline: schema.lessons.discipline,
      status: schema.lessons.status,
    })
    .from(schema.lessons)
    .where(
      and(
        eq(schema.lessons.clubId, primary.clubId),
        gte(schema.lessons.date, now),
      ),
    )
    .orderBy(schema.lessons.date)
    .limit(3);

  const upcomingEvents = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      startsAt: schema.events.startsAt,
      kind: schema.events.kind,
    })
    .from(schema.events)
    .where(
      and(
        eq(schema.events.clubId, primary.clubId),
        gte(schema.events.startsAt, now),
      ),
    )
    .orderBy(schema.events.startsAt)
    .limit(3);

  const recentNotifications = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.profileId, user.id))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(5);

  const isStaff = roles.some((r) => ['owner', 'admin', 'instructor'].includes(r));
  const isHorseOwner = roles.includes('horse_owner');
  const isRider = roles.includes('rider');
  const isGroom = roles.includes('groom');

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          Panel · {roleLabel(primary.role)}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-stone-900 md:text-4xl">
          Hola, {session.profile?.fullName ?? user.email.split('@')[0]}
        </h1>
        <p className="mt-1 text-sm font-medium text-stone-500">
          {primary.clubName} · Código <span className="font-mono">{primary.clubSlug}</span>
        </p>
      </header>

      {isStaff && (
        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Kpi
            label="Caballos"
            value={horseCount?.n ?? 0}
            href="/app/horses"
            icon={<HorseIcon size={22} weight="duotone" />}
          />
          <Kpi
            label="Alumnos"
            value={riderCount?.n ?? 0}
            href="/app/riders"
            icon={<GraduationCapIcon size={22} weight="duotone" />}
          />
          <Kpi
            label="Próximas clases"
            value={upcomingLessons.length}
            href="/app/lessons"
            icon={<CalendarBlankIcon size={22} weight="duotone" />}
          />
        </section>
      )}

      <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isStaff && (
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">
                Atajos rápidos
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                Hípica
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Shortcut
                href="/app/courses"
                icon={<BookOpenTextIcon size={20} weight="duotone" />}
                label="Nuevo curso"
              />
              <Shortcut
                href="/app/lessons"
                icon={<CalendarBlankIcon size={20} weight="duotone" />}
                label="Nueva clase"
              />
              <Shortcut
                href="/app/events"
                icon={<TrophyIcon size={20} weight="duotone" />}
                label="Nuevo evento"
              />
              <Shortcut
                href="/app/news"
                icon={<NewspaperIcon size={20} weight="duotone" />}
                label="Publicar noticia"
              />
              <Shortcut
                href="/app/bonos"
                icon={<TicketIcon size={20} weight="duotone" />}
                label="Crear bono"
              />
              <Shortcut
                href="/app/ai"
                icon={<MicrophoneStageIcon size={20} weight="duotone" />}
                label="Nota de voz IA"
              />
            </div>
          </div>
        )}

        {isRider && (
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">Mi panel</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                Alumno
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Shortcut href="/app/me/lessons" icon={<CalendarBlankIcon size={20} weight="duotone" />} label="Mis clases" />
              <Shortcut href="/app/me/horses" icon={<HorseIcon size={20} weight="duotone" />} label="Mis caballos" />
              <Shortcut href="/app/me/events" icon={<TrophyIcon size={20} weight="duotone" />} label="Eventos" />
              <Shortcut href="/app/me/bonos" icon={<TicketIcon size={20} weight="duotone" />} label="Bonos" />
            </div>
          </div>
        )}

        {isHorseOwner && (
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">Mis caballos</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                Propietario
              </p>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <Shortcut
                href="/app/horse-owner"
                icon={<CertificateIcon size={20} weight="duotone" />}
                label="Ver agenda y cuidados"
              />
            </div>
          </div>
        )}

        {isGroom && (
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">Cuadra</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                Mozo
              </p>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <Shortcut
                href="/app/groom"
                icon={<ClipboardTextIcon size={20} weight="duotone" />}
                label="Checklist del día"
              />
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">Próximamente</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Calendario
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {upcomingLessons.length === 0 && upcomingEvents.length === 0 && (
              <p className="text-sm font-medium text-stone-500">
                Sin eventos ni clases programadas.
              </p>
            )}
            {upcomingLessons.map((l) => (
              <Link
                key={l.id}
                href="/app/lessons"
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3 hover:border-brand-300"
              >
                <div>
                  <div className="text-sm font-bold text-stone-900">
                    Clase de {l.discipline}
                  </div>
                  <div className="text-[11px] font-medium text-stone-500">
                    {new Date(l.date).toLocaleString('es-ES', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <ArrowRightIcon size={16} className="text-stone-400" />
              </Link>
            ))}
            {upcomingEvents.map((e) => (
              <Link
                key={e.id}
                href="/app/events"
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3 hover:border-brand-300"
              >
                <div>
                  <div className="text-sm font-bold text-stone-900">
                    {e.title}
                  </div>
                  <div className="text-[11px] font-medium text-stone-500">
                    {e.kind} ·{' '}
                    {new Date(e.startsAt).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                </div>
                <ArrowRightIcon size={16} className="text-stone-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">
            Últimas notificaciones
          </h2>
          <Link
            href="/app/notifications"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700 hover:text-brand-900"
          >
            Ver todas
          </Link>
        </div>
        {recentNotifications.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">
            No tienes notificaciones. Cuando alguien complete un checklist o la
            IA prepare feedback, aparecerá aquí.
          </p>
        ) : (
          <div className="space-y-2">
            {recentNotifications.map((n) => (
              <div
                key={n.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50 p-3"
              >
                <div>
                  <div className="text-sm font-bold text-stone-900">
                    {n.title}
                  </div>
                  {n.body && (
                    <p className="mt-0.5 text-xs font-medium text-stone-600">
                      {n.body}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  {new Date(n.createdAt).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: number;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {label}
        </div>
        <div className="mt-0.5 text-3xl font-bold text-stone-900">{value}</div>
      </div>
      <ArrowRightIcon
        size={18}
        className="text-stone-300 transition group-hover:text-brand-600"
      />
    </Link>
  );
}

function Shortcut({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-700 transition hover:border-brand-300 hover:bg-white hover:text-brand-700"
    >
      <span className="text-brand-700">{icon}</span>
      {label}
    </Link>
  );
}
