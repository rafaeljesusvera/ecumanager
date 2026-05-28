import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { desc, eq } from 'drizzle-orm';
import { MedalIcon } from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { PageHeader } from '@/components/page/PageHeader';
import { EmptyState } from '@/components/ui';
import { BadgeCard } from '@/components/badge/BadgeCard';
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
      subtitle: schema.badges.subtitle,
      categoryLabel: schema.badges.categoryLabel,
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
        description="Tus reconocimientos en formato carta. Tócalas para ver la fecha y la nota del instructor."
      />

      {badges.length === 0 ? (
        <EmptyState
          icon={<MedalIcon size={40} weight="duotone" />}
          title="Aún no tienes insignias"
          description="Tu instructor las otorga al cumplir hitos: primer galope, primer salto, primera competición..."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {badges.map((b) => (
            <Link
              key={b.id}
              href={`/app/me/badges/${b.id}` as never}
              className="group block transition hover:-translate-y-1"
            >
              <BadgeCard
                clubName={session.primary.clubName}
                recipientName={rider!.name}
                badge={b}
              />
              <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-3 text-xs">
                <div className="font-bold text-stone-900">
                  Entregada {formatDate(b.awardedAt)}
                </div>
                {b.notes && (
                  <p className="mt-1 line-clamp-2 font-medium italic text-stone-600">
                    «{b.notes}»
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
