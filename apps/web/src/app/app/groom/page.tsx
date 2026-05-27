import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { and, eq, sql } from 'drizzle-orm';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  HorseIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, EmptyState } from '@/components/ui';

export const metadata = { title: 'Mi día (mozo)' };
export const dynamic = 'force-dynamic';

export default async function GroomPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const session = await ensureSession();
  assertRole(session, ['groom', 'owner', 'admin']);
  const { done } = await searchParams;

  const today = new Date().toISOString().slice(0, 10);

  const horses = await db
    .select({
      id: schema.horses.id,
      name: schema.horses.name,
      kind: schema.horses.kind,
      status: schema.horses.status,
      logCount: sql<number>`(
        SELECT count(*)::int FROM horse_care_logs hcl
        WHERE hcl.horse_id = ${schema.horses.id} AND hcl.for_date = ${today}
      )`,
    })
    .from(schema.horses)
    .where(
      and(
        eq(schema.horses.clubId, session.primary.clubId),
        eq(schema.horses.status, 'activo'),
      ),
    )
    .orderBy(schema.horses.name);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Cuadra · Mozo"
        title="Mi día"
        description="Marca el checklist diario de cada caballo. Cuando terminas, el propietario y el instructor lo ven al instante."
      />

      {done && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          <CheckCircleIcon size={16} weight="fill" /> Checklist de {done} guardado.
        </div>
      )}

      {horses.length === 0 ? (
        <EmptyState
          icon={<HorseIcon size={40} weight="duotone" />}
          title="No hay caballos activos"
          description="Pide a la hípica que dé de alta caballos en estado activo para empezar a cuidarlos."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {horses.map((h) => {
            const done = h.logCount > 0;
            return (
              <Link
                key={h.id}
                href={`/app/groom/${h.id}`}
                className="group flex items-center justify-between rounded-3xl border border-stone-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <HorseIcon size={22} weight="duotone" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-stone-900">
                      {h.name}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                      {h.kind}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {done ? (
                    <Badge tone="success">
                      <CheckCircleIcon size={11} weight="bold" /> hecho
                    </Badge>
                  ) : (
                    <Badge tone="warn">pendiente</Badge>
                  )}
                  <ArrowRightIcon
                    size={16}
                    className="text-stone-300 transition group-hover:text-brand-600"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
