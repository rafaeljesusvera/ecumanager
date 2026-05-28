import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, desc, eq } from 'drizzle-orm';
import {
  CalendarBlankIcon,
  HorseIcon,
  ChatCircleTextIcon,
  GraduationCapIcon,
  SparkleIcon,
  ClockIcon,
  TagIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import { Badge } from '@/components/ui';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [l] = await db
    .select({ discipline: schema.lessons.discipline, date: schema.lessons.date })
    .from(schema.lessons)
    .where(eq(schema.lessons.id, id))
    .limit(1);
  return {
    title: l ? `Clase de ${l.discipline}` : 'Clase',
  };
}

export default async function MeLessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['rider', 'owner', 'admin', 'instructor']);
  const { id } = await params;

  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );

  const [row] = await db
    .select({
      id: schema.lessons.id,
      date: schema.lessons.date,
      duration: schema.lessons.durationMinutes,
      discipline: schema.lessons.discipline,
      status: schema.lessons.status,
      notes: schema.lessons.notes,
      instructorName: schema.profiles.fullName,
      instructorEmail: schema.profiles.email,
    })
    .from(schema.lessons)
    .innerJoin(schema.profiles, eq(schema.profiles.id, schema.lessons.instructorId))
    .where(
      and(
        eq(schema.lessons.id, id),
        eq(schema.lessons.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!row) notFound();

  // Verifica que el rider está como asistente
  const [attendee] = await db
    .select({
      id: schema.lessonAttendees.id,
      horseId: schema.lessonAttendees.horseId,
      attended: schema.lessonAttendees.attended,
    })
    .from(schema.lessonAttendees)
    .where(
      and(
        eq(schema.lessonAttendees.lessonId, id),
        eq(schema.lessonAttendees.riderId, rider!.id),
      ),
    )
    .limit(1);
  if (!attendee && session.primary.role === 'rider') notFound();

  const [myHorse] = attendee?.horseId
    ? await db
        .select()
        .from(schema.horses)
        .where(eq(schema.horses.id, attendee.horseId))
        .limit(1)
    : [];

  const classmates = await db
    .select({
      id: schema.lessonAttendees.id,
      riderName: schema.riders.name,
      horseName: schema.horses.name,
    })
    .from(schema.lessonAttendees)
    .innerJoin(schema.riders, eq(schema.riders.id, schema.lessonAttendees.riderId))
    .leftJoin(schema.horses, eq(schema.horses.id, schema.lessonAttendees.horseId))
    .where(eq(schema.lessonAttendees.lessonId, id));

  const feedback = await db
    .select()
    .from(schema.lessonFeedback)
    .where(
      and(
        eq(schema.lessonFeedback.lessonId, id),
        eq(schema.lessonFeedback.riderId, rider!.id),
      ),
    )
    .orderBy(desc(schema.lessonFeedback.createdAt));

  return (
    <DetailShell
      backHref="/app/me/lessons"
      backLabel="Mis clases"
      eyebrow={`Clase · ${row.discipline}`}
      title={formatDateTime(row.date, {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })}
      status={{
        label: row.status,
        tone:
          row.status === 'realizada'
            ? 'success'
            : row.status === 'cancelada'
              ? 'danger'
              : 'brand',
      }}
    >
      <DetailSection title="Resumen">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoTile
            icon={<CalendarBlankIcon size={20} weight="duotone" />}
            label="Cuándo"
            value={formatDateTime(row.date)}
          />
          <InfoTile
            icon={<ClockIcon size={20} weight="duotone" />}
            label="Duración"
            value={`${row.duration} minutos`}
          />
          <InfoTile
            icon={<TagIcon size={20} weight="duotone" />}
            label="Disciplina"
            value={row.discipline.replace('_', ' ')}
          />
          <InfoTile
            icon={<GraduationCapIcon size={20} weight="duotone" />}
            label="Instructor"
            value={row.instructorName ?? row.instructorEmail}
          />
        </div>
      </DetailSection>

      {row.notes && (
        <DetailSection title="Notas de la clase">
          <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-stone-700">
            {row.notes}
          </p>
        </DetailSection>
      )}

      <DetailSection title="Tu caballo">
        {myHorse ? (
          <Link
            href={`/app/me/horses` as never}
            className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 hover:border-brand-300"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <HorseIcon size={22} weight="duotone" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-stone-900">{myHorse.name}</div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                {myHorse.kind}
                {myHorse.breed ? ` · ${myHorse.breed}` : ''}
              </div>
            </div>
          </Link>
        ) : (
          <p className="text-sm font-medium text-stone-500">
            Aún sin caballo asignado. El instructor lo confirma antes de la clase.
          </p>
        )}
      </DetailSection>

      <DetailSection
        title="Compañeros"
        description={`${classmates.length} jinete${classmates.length === 1 ? '' : 's'} en esta clase.`}
      >
        {classmates.length === 0 ? (
          <p className="text-sm font-medium text-stone-500">Estarás solo.</p>
        ) : (
          <div className="space-y-1.5">
            {classmates.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2"
              >
                <div className="text-sm font-bold text-stone-900">
                  {c.riderName}
                </div>
                {c.horseName && (
                  <Badge tone="neutral">{c.horseName}</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      {feedback.length > 0 && (
        <DetailSection
          title="Comentarios del instructor"
          description="Lo que escribió (o dictó por IA) para ti tras la clase."
        >
          <div className="space-y-2">
            {feedback.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl border border-stone-200 bg-brand-50/40 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <ChatCircleTextIcon
                    size={16}
                    weight="duotone"
                    className="text-brand-700"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    {formatDateTime(f.createdAt)}
                  </span>
                  {f.source === 'ia' && (
                    <Badge tone="info">
                      <SparkleIcon size={10} weight="bold" /> IA
                    </Badge>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-stone-800">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </DetailSection>
      )}
    </DetailShell>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {label}
        </div>
        <div className="truncate text-sm font-bold capitalize text-stone-900">
          {value}
        </div>
      </div>
    </div>
  );
}
