import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import {
  MedalIcon,
  CalendarBlankIcon,
  ChatCircleTextIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import { BadgeCard } from '@/components/badge/BadgeCard';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db
    .select({ name: schema.badges.name })
    .from(schema.riderBadges)
    .innerJoin(schema.badges, eq(schema.badges.id, schema.riderBadges.badgeId))
    .where(eq(schema.riderBadges.id, id))
    .limit(1);
  return { title: row?.name ?? 'Insignia' };
}

export default async function MeBadgeDetailPage({
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
      awardId: schema.riderBadges.id,
      awardedAt: schema.riderBadges.awardedAt,
      notes: schema.riderBadges.notes,
      name: schema.badges.name,
      subtitle: schema.badges.subtitle,
      categoryLabel: schema.badges.categoryLabel,
      description: schema.badges.description,
      iconUrl: schema.badges.iconUrl,
      color: schema.badges.color,
      awardedByName: schema.profiles.fullName,
      awardedByEmail: schema.profiles.email,
    })
    .from(schema.riderBadges)
    .innerJoin(schema.badges, eq(schema.badges.id, schema.riderBadges.badgeId))
    .leftJoin(
      schema.profiles,
      eq(schema.profiles.id, schema.riderBadges.awardedBy),
    )
    .where(
      and(
        eq(schema.riderBadges.id, id),
        eq(schema.riderBadges.riderId, rider!.id),
      ),
    )
    .limit(1);
  if (!row) notFound();

  return (
    <DetailShell
      backHref="/app/me/badges"
      backLabel="Mis insignias"
      eyebrow="Insignia"
      title={row.name}
      description={row.description ?? undefined}
    >
      <div className="mx-auto max-w-xs">
        <BadgeCard
          clubName={session.primary.clubName}
          recipientName={rider!.name}
          badge={{
            name: row.name,
            subtitle: row.subtitle,
            categoryLabel: row.categoryLabel,
            color: row.color,
            iconUrl: row.iconUrl,
          }}
          ratio="tall"
        />
      </div>

      <DetailSection title="Entrega">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Tile
            icon={<CalendarBlankIcon size={20} weight="duotone" />}
            label="Fecha"
            value={formatDate(row.awardedAt)}
          />
          <Tile
            icon={<MedalIcon size={20} weight="duotone" />}
            label="Otorgada por"
            value={row.awardedByName ?? row.awardedByEmail ?? 'La hípica'}
          />
        </div>
      </DetailSection>

      {row.notes && (
        <DetailSection
          title="Mensaje del instructor"
          description="Lo que escribió al entregártela."
        >
          <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-brand-700">
              <ChatCircleTextIcon size={16} weight="duotone" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                {formatDate(row.awardedAt)}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm font-medium italic leading-relaxed text-stone-800">
              «{row.notes}»
            </p>
          </div>
        </DetailSection>
      )}

      {row.description && (
        <DetailSection title="¿Qué reconoce esta insignia?">
          <p className="text-sm font-medium leading-relaxed text-stone-700">
            {row.description}
          </p>
        </DetailSection>
      )}
    </DetailShell>
  );
}

function Tile({
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
        <div className="truncate text-sm font-bold text-stone-900">{value}</div>
      </div>
    </div>
  );
}
