import { db, schema } from '@equmanager/database';
import { isNotNull, sql } from 'drizzle-orm';
import {
  BuildingsIcon,
  HorseIcon,
  GraduationCapIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  SealCheckIcon,
} from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page/PageHeader';

export const metadata = { title: 'Superadmin · Resumen' };
export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  // Una sola pasada en paralelo: 6 counts simples sin agrupaciones.
  const [clubsR, horsesR, ridersR, profilesR, directoryR, federatedR] =
    await Promise.all([
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(schema.clubs),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(schema.horses),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(schema.riders),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(schema.profiles),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(schema.directoryClubs),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(schema.clubs)
        .where(isNotNull(schema.clubs.directoryClubId))
        .catch(() => [{ n: 0 }]),
    ]);

  const totals = {
    clubs: clubsR[0]?.n ?? 0,
    horses: horsesR[0]?.n ?? 0,
    riders: ridersR[0]?.n ?? 0,
    profiles: profilesR[0]?.n ?? 0,
    directory: directoryR[0]?.n ?? 0,
    federated: federatedR[0]?.n ?? 0,
  };

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Resumen del sistema"
        description="Estado actual de Equmanager en todos los clubes."
      />

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Kpi
          icon={<BuildingsIcon size={22} weight="duotone" />}
          label="Clubes operativos"
          value={totals.clubs}
        />
        <Kpi
          icon={<UsersIcon size={22} weight="duotone" />}
          label="Usuarios"
          value={totals.profiles}
        />
        <Kpi
          icon={<HorseIcon size={22} weight="duotone" />}
          label="Caballos"
          value={totals.horses}
        />
        <Kpi
          icon={<GraduationCapIcon size={22} weight="duotone" />}
          label="Alumnos"
          value={totals.riders}
        />
        <Kpi
          icon={<MagnifyingGlassIcon size={22} weight="duotone" />}
          label="Directorio"
          value={totals.directory}
        />
      </div>

      <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5">
        <div className="flex items-center gap-3">
          <SealCheckIcon
            size={28}
            weight="fill"
            className="text-emerald-700"
          />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
              Clubes federados activos
            </div>
            <div className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
              {totals.federated}
              <span className="ml-2 text-lg font-bold text-emerald-700">
                / {totals.directory}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-stone-600">
              Hípicas operativas que han reclamado su entrada del padrón
              oficial (RFHE o autonómicas).
            </p>
          </div>
        </div>
        {totals.directory > 0 && (
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-all"
              style={{
                width: `${(totals.federated / totals.directory) * 100}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          {icon}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {label}
        </div>
      </div>
      <div className="mt-3 text-4xl font-bold tracking-tight text-stone-900">
        {value.toLocaleString('es-ES')}
      </div>
    </div>
  );
}
