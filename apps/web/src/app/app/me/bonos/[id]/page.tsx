import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import {
  TicketIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { ensureRiderForProfile } from '@/lib/db/rider';
import { DetailShell, DetailSection } from '@/components/detail/DetailShell';
import { formatCents, formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [b] = await db
    .select({ name: schema.bonos.name })
    .from(schema.bonos)
    .innerJoin(schema.bonoPurchases, eq(schema.bonoPurchases.bonoId, schema.bonos.id))
    .where(eq(schema.bonoPurchases.id, id))
    .limit(1);
  return { title: b?.name ?? 'Bono' };
}

export default async function MeBonoDetailPage({
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
      purchase: schema.bonoPurchases,
      bono: schema.bonos,
    })
    .from(schema.bonoPurchases)
    .innerJoin(schema.bonos, eq(schema.bonos.id, schema.bonoPurchases.bonoId))
    .where(
      and(
        eq(schema.bonoPurchases.id, id),
        eq(schema.bonoPurchases.riderId, rider!.id),
      ),
    )
    .limit(1);
  if (!row) notFound();

  const used = row.bono.totalClasses - row.purchase.classesLeft;
  const pctUsed = Math.round((used / row.bono.totalClasses) * 100);
  const expired = row.purchase.expiresAt
    ? new Date(row.purchase.expiresAt) < new Date()
    : false;

  return (
    <DetailShell
      backHref="/app/me/bonos"
      backLabel="Mis bonos"
      eyebrow="Bono"
      title={row.bono.name}
      description={row.bono.description ?? undefined}
      status={
        expired
          ? { label: 'Caducado', tone: 'danger' }
          : row.purchase.classesLeft === 0
            ? { label: 'Sin saldo', tone: 'warn' }
            : { label: 'Activo', tone: 'success' }
      }
    >
      {row.bono.photoUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-stone-100">
          <Image
            src={row.bono.photoUrl}
            alt={row.bono.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>
      )}

      <DetailSection title="Tu saldo">
        <div className="rounded-3xl border border-brand-200 bg-brand-50 p-6 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-800">
            Clases restantes
          </div>
          <div className="mt-1 text-5xl font-bold text-brand-700">
            {row.purchase.classesLeft}
            <span className="text-2xl text-brand-400"> / {row.bono.totalClasses}</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
            <div
              className="h-full bg-brand-600 transition-all"
              style={{ width: `${100 - pctUsed}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-medium text-stone-600">
            Ya has consumido {used} clase{used === 1 ? '' : 's'}.
          </p>
        </div>
      </DetailSection>

      <DetailSection title="Detalle de la compra">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Tile
            icon={<TicketIcon size={20} weight="duotone" />}
            label="Importe pagado"
            value={formatCents(row.bono.priceCents)}
          />
          <Tile
            icon={<CheckCircleIcon size={20} weight="duotone" />}
            label="Comprado"
            value={formatDate(row.purchase.purchasedAt)}
          />
          {row.purchase.expiresAt && (
            <Tile
              icon={<ClockIcon size={20} weight="duotone" />}
              label="Caduca"
              value={formatDate(row.purchase.expiresAt)}
            />
          )}
          <Tile
            icon={<TicketIcon size={20} weight="duotone" />}
            label="Validez total"
            value={`${row.bono.validityDays} días`}
          />
        </div>
      </DetailSection>

      <DetailSection
        title="Cómo funciona"
        description="Cada clase reservada consume 1 unidad del bono."
      >
        <p className="text-sm font-medium leading-relaxed text-stone-600">
          Si necesitas pausar el bono por una lesión o ausencia larga, habla
          con la hípica directamente. Aún no automatizamos las pausas.
        </p>
      </DetailSection>
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

