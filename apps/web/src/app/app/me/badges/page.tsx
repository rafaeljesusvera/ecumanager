import { db, schema } from '@equmanager/database';
import { desc, eq } from 'drizzle-orm';
import { MedalIcon } from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { PageHeader } from '@/components/page/PageHeader';
import { EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Mis insignias' };
export const dynamic = 'force-dynamic';

export default async function MeBadgesPage() {
  const session = await ensureSession();
  assertRole(session, ['rider', 'owner', 'admin', 'instructor']);

  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );

  const badges = await db
    .select({
      id: schema.riderBadges.id,
      awardedAt: schema.riderBadges.awardedAt,
      notes: schema.riderBadges.notes,
      name: schema.badges.name,
      description: schema.badges.description,
      iconUrl: schema.badges.iconUrl,
      color: schema.badges.color,
    })
    .from(schema.riderBadges)
    .innerJoin(schema.badges, eq(schema.badges.id, schema.riderBadges.badgeId))
    .where(eq(schema.riderBadges.riderId, rider!.id))
    .orderBy(desc(schema.riderBadges.awardedAt));

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Alumno"
        title="Mis insignias"
        description="Reconocimientos por hitos en tu progreso ecuestre."
      />

      {badges.length === 0 ? (
        <EmptyState
          icon={<MedalIcon size={40} weight="duotone" />}
          title="Aún no tienes insignias"
          description="Tu instructor las otorga al cumplir hitos: primer galope, primer salto, primera competición..."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {badges.map((b) => (
            <article
              key={b.id}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-card"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${b.color}20`, color: b.color }}
                >
                  <MedalIcon size={28} weight="fill" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">{b.name}</h3>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    {formatDate(b.awardedAt)}
                  </p>
                </div>
              </div>
              {b.description && (
                <p className="mt-3 text-sm font-medium leading-relaxed text-stone-600">
                  {b.description}
                </p>
              )}
              {b.notes && (
                <p className="mt-2 text-xs font-medium italic text-stone-500">
                  «{b.notes}»
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
