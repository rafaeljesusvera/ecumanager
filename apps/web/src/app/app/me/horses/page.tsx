import { db, schema } from '@equmanager/database';
import { and, desc, eq, sql } from 'drizzle-orm';
import { HorseIcon, StarIcon } from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, Button, EmptyState, Field, Input, Select } from '@/components/ui';
import { postReviewAction } from './actions';

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

  // Caballos que ha montado este rider, ordenados por número de veces
  const rows = await db
    .select({
      horseId: schema.lessonAttendees.horseId,
      horseName: schema.horses.name,
      kind: schema.horses.kind,
      rides: sql<number>`count(*)::int`,
      lastRide: sql<Date>`max(${schema.lessons.date})`,
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
    .groupBy(schema.lessonAttendees.horseId, schema.horses.name, schema.horses.kind)
    .orderBy(desc(sql`count(*)`));

  const myReviews = await db
    .select()
    .from(schema.horseReviews)
    .where(eq(schema.horseReviews.riderId, rider!.id));

  const reviewByHorse = new Map(myReviews.map((r) => [r.horseId, r]));

  const allReviews = await db
    .select({
      id: schema.horseReviews.id,
      horseId: schema.horseReviews.horseId,
      rating: schema.horseReviews.rating,
      title: schema.horseReviews.title,
      body: schema.horseReviews.body,
      riderName: schema.riders.name,
    })
    .from(schema.horseReviews)
    .innerJoin(schema.riders, eq(schema.riders.id, schema.horseReviews.riderId))
    .where(eq(schema.riders.clubId, session.primary.clubId))
    .orderBy(desc(schema.horseReviews.createdAt))
    .limit(50);

  const reviewsByHorse = new Map<string, typeof allReviews>();
  allReviews.forEach((r) => {
    const list = reviewsByHorse.get(r.horseId) ?? [];
    list.push(r);
    reviewsByHorse.set(r.horseId, list);
  });

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Alumno"
        title="Mis caballos"
        description="Los que has montado, ordenados por afinidad. Opina para ayudar al resto."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<HorseIcon size={40} weight="duotone" />}
          title="Aún no has montado en clase"
          description="Cuando tu instructor te asigne un caballo en una clase realizada, aparecerá aquí."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rows.map((r) => {
            const myReview = r.horseId ? reviewByHorse.get(r.horseId) : null;
            const otherReviews = (r.horseId ? reviewsByHorse.get(r.horseId) : [])?.filter(
              (rev) => rev.id !== myReview?.id,
            );
            return (
              <article
                key={r.horseId ?? ''}
                className="rounded-3xl border border-stone-200 bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                      <HorseIcon size={24} weight="duotone" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-stone-900">
                        {r.horseName}
                      </h3>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                        {r.kind} · {r.rides} montura{r.rides !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Badge tone="brand">afinidad {Math.min(99, r.rides * 12)}%</Badge>
                </div>

                {(otherReviews?.length ?? 0) > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                      Opiniones de otros jinetes
                    </p>
                    {otherReviews!.slice(0, 3).map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-stone-900">
                            {rev.riderName}
                          </div>
                          <div className="text-xs font-bold text-brand-700">
                            {'★'.repeat(rev.rating)}
                          </div>
                        </div>
                        {rev.body && (
                          <p className="mt-1 text-xs font-medium text-stone-600">
                            {rev.body}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <form
                  action={postReviewAction}
                  className="mt-4 rounded-2xl border border-brand-200 bg-brand-50/50 p-3"
                >
                  <input type="hidden" name="horseId" value={r.horseId ?? ''} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-800">
                    Tu opinión
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-5">
                    <div className="md:col-span-1">
                      <Field label="★">
                        <Select name="rating" defaultValue={String(myReview?.rating ?? 5)}>
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                    <div className="md:col-span-4">
                      <Field label="Comentario">
                        <Input
                          name="body"
                          defaultValue={myReview?.body ?? ''}
                          placeholder="Tu experiencia con este caballo"
                          maxLength={200}
                        />
                      </Field>
                    </div>
                  </div>
                  <Button type="submit" size="sm" variant="secondary" className="mt-2">
                    <StarIcon size={12} weight="fill" /> Guardar opinión
                  </Button>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
