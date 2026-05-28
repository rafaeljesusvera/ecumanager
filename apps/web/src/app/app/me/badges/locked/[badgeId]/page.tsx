import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import {
  LockKeyIcon,
  TargetIcon,
  LightbulbIcon,
  ChatCircleTextIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import { BadgeCard } from '@/components/badge/BadgeCard';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ badgeId: string }>;
}) {
  const { badgeId } = await params;
  const [b] = await db
    .select({ name: schema.badges.name })
    .from(schema.badges)
    .where(eq(schema.badges.id, badgeId))
    .limit(1);
  return { title: b ? `${b.name} (bloqueada)` : 'Insignia bloqueada' };
}

export default async function LockedBadgePage({
  params,
}: {
  params: Promise<{ badgeId: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['rider', 'owner', 'admin', 'instructor']);
  const { badgeId } = await params;

  const rider = await ensureRiderForProfile(
    session.user.id,
    session.primary.clubId,
    session.profile?.fullName ?? null,
    session.profile?.email ?? null,
  );

  const [badge] = await db
    .select()
    .from(schema.badges)
    .where(
      and(
        eq(schema.badges.id, badgeId),
        eq(schema.badges.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!badge) notFound();

  // Si ya la tiene, redirige al detalle "entregada"
  const [already] = await db
    .select()
    .from(schema.riderBadges)
    .where(
      and(
        eq(schema.riderBadges.badgeId, badgeId),
        eq(schema.riderBadges.riderId, rider!.id),
      ),
    )
    .limit(1);
  if (already) {
    return (
      <DetailShell
        backHref="/app/me/badges"
        backLabel="Mis insignias"
        eyebrow="Insignia"
        title={badge.name}
        status={{ label: 'Ya la tienes', tone: 'success' }}
      >
        <DetailSection title="Ya la has desbloqueado">
          <p className="text-sm font-medium text-stone-600">
            Esta insignia ya está en tu colección. Ve a{' '}
            <a
              href={`/app/me/badges/${already.id}`}
              className="font-bold text-brand-700 underline"
            >
              su ficha completa
            </a>{' '}
            para ver la fecha y la nota del instructor.
          </p>
        </DetailSection>
      </DetailShell>
    );
  }

  return (
    <DetailShell
      backHref="/app/me/badges"
      backLabel="Mis insignias"
      eyebrow="Insignia bloqueada"
      title={badge.name}
      description={badge.subtitle ?? undefined}
      status={{ label: 'Bloqueada', tone: 'neutral' }}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
        {/* Carta bloqueada */}
        <div className="mx-auto w-full max-w-xs lg:sticky lg:top-24">
          <BadgeCard
            clubName={session.primary.clubName}
            recipientName={rider!.name}
            badge={{
              name: badge.name,
              subtitle: badge.subtitle,
              categoryLabel: badge.categoryLabel,
              color: badge.color,
              iconUrl: badge.iconUrl,
            }}
            ratio="tall"
            locked
          />
        </div>

        {/* Cómo desbloquearla */}
        <div className="space-y-5">
          <DetailSection
            title="Cómo desbloquearla"
            description="El objetivo que tu hípica ha marcado para esta insignia."
          >
            <div className="flex gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white shadow-card">
                <TargetIcon size={20} weight="duotone" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-800">
                  Objetivo
                </div>
                {badge.description ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-relaxed text-stone-800">
                    {badge.description}
                  </p>
                ) : (
                  <p className="mt-1 text-sm font-medium italic text-stone-500">
                    Tu hípica aún no ha publicado el criterio. Pregúntale a tu
                    instructor cómo desbloquearla.
                  </p>
                )}
              </div>
            </div>
          </DetailSection>

          {badge.subtitle && (
            <DetailSection title="Lo que reconoce">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <LightbulbIcon size={20} weight="duotone" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">
                    {badge.subtitle}
                  </p>
                  {badge.categoryLabel && (
                    <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                      {badge.categoryLabel}
                    </p>
                  )}
                </div>
              </div>
            </DetailSection>
          )}

          <DetailSection title="Próximos pasos">
            <ul className="space-y-2 text-sm font-medium text-stone-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-black text-brand-800">
                  1
                </span>
                Comparte el objetivo con tu instructor en tu próxima clase.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-black text-brand-800">
                  2
                </span>
                Pídele consejos concretos para trabajarlo durante las sesiones.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-black text-brand-800">
                  3
                </span>
                Cuando crea que lo cumples, te la entregará y aparecerá en tu
                colección con su carta a todo color.
              </li>
            </ul>
          </DetailSection>

          <DetailSection
            title="¿Dudas?"
            description="Habla con tu instructor o con la hípica."
          >
            <div className="flex items-start gap-3 rounded-2xl border border-stone-200/70 bg-stone-50/70 p-3">
              <ChatCircleTextIcon
                size={20}
                weight="duotone"
                className="shrink-0 text-brand-700"
              />
              <p className="text-sm font-medium text-stone-700">
                Cada hípica decide cuándo entrega cada insignia. El objetivo de
                arriba es una guía: el instructor confirma cuando lo ve.
              </p>
            </div>
          </DetailSection>
        </div>
      </div>

      {/* Footer informativo */}
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200/70 bg-white/70 p-3 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">
        <LockKeyIcon size={12} weight="bold" /> Sigue subiéndote a montar
      </div>
    </DetailShell>
  );
}
