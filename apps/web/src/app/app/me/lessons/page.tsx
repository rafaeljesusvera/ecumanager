import { db, schema } from '@equmanager/database';
import { desc, eq } from 'drizzle-orm';
import { CalendarBlankIcon } from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, EmptyState } from '@/components/ui';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Mis clases' };
export const dynamic = 'force-dynamic';

export default async function MeLessonsPage() {
  const session = await ensureSession();
  assertRole(session, ['rider', 'owner', 'admin', 'instructor']);

  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );

  const lessons = await db
    .select({
      attendeeId: schema.lessonAttendees.id,
      lessonId: schema.lessons.id,
      date: schema.lessons.date,
      discipline: schema.lessons.discipline,
      status: schema.lessons.status,
      attended: schema.lessonAttendees.attended,
      horseName: schema.horses.name,
    })
    .from(schema.lessonAttendees)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonAttendees.lessonId))
    .leftJoin(schema.horses, eq(schema.horses.id, schema.lessonAttendees.horseId))
    .where(eq(schema.lessonAttendees.riderId, rider!.id))
    .orderBy(desc(schema.lessons.date))
    .limit(60);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Alumno"
        title="Mis clases"
        description="Todas tus clases programadas, realizadas y canceladas."
      />

      {lessons.length === 0 ? (
        <EmptyState
          icon={<CalendarBlankIcon size={40} weight="duotone" />}
          title="Sin clases"
          description="Cuando tu instructor te incluya en una clase, aparecerá aquí."
        />
      ) : (
        <div className="space-y-2">
          {lessons.map((l) => (
            <div
              key={l.attendeeId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-card"
            >
              <div>
                <div className="text-sm font-bold text-stone-900">
                  {formatDateTime(l.date, {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  {l.discipline}
                  {l.horseName ? ` · ${l.horseName}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    l.status === 'realizada'
                      ? 'success'
                      : l.status === 'cancelada'
                        ? 'danger'
                        : 'brand'
                  }
                >
                  {l.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
