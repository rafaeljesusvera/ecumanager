import { db, schema } from '@equmanager/database';
import { sql, type SQL } from 'drizzle-orm';
import { type PgTable } from 'drizzle-orm/pg-core';
import {
  BuildingsIcon,
  HorseIcon,
  GraduationCapIcon,
  UsersIcon,
} from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page/PageHeader';
import {
  EvolutionChart,
  type EvolutionPoint,
} from '@/components/admin/EvolutionChart';

export const metadata = { title: 'Superadmin · Resumen' };
export const dynamic = 'force-dynamic';

const MONTHS = 12;

const MONTH_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

type RawCount = { month: string; n: number };

async function monthlyCumulative(
  table: PgTable,
  createdAtCol: SQL,
): Promise<{ total: number; points: EvolutionPoint[]; growthLabel: string }> {
  // Recogemos altas por mes en los últimos 12 meses + el "antes" para arranque
  const rows = (await db.execute(sql`
    select
      to_char(date_trunc('month', ${createdAtCol}), 'YYYY-MM') as month,
      count(*)::int as n
    from ${table}
    group by 1
    order by 1 asc
  `)) as unknown as { rows?: RawCount[] } | RawCount[];

  const data: RawCount[] = Array.isArray(rows)
    ? (rows as RawCount[])
    : ((rows as { rows?: RawCount[] }).rows ?? []);

  // Construimos calendario de los últimos MONTHS meses
  const now = new Date();
  const buckets: Array<{ key: string; label: string }> = [];
  for (let i = MONTHS - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    buckets.push({ key, label });
  }
  const startKey = buckets[0]!.key;
  // Acumulado anterior al primer mes mostrado
  let cumulative = data
    .filter((r) => r.month < startKey)
    .reduce((acc, r) => acc + Number(r.n), 0);

  const byMonth = new Map(data.map((r) => [r.month, Number(r.n)]));
  const points: EvolutionPoint[] = buckets.map((b) => {
    cumulative += byMonth.get(b.key) ?? 0;
    return { label: b.label, value: cumulative };
  });

  const total = points[points.length - 1]?.value ?? 0;
  const baseline = points[0]?.value ?? 0;
  const growth = total - baseline;
  const growthLabel =
    baseline === 0
      ? total > 0
        ? '+ nuevo'
        : '0'
      : `${growth >= 0 ? '+' : ''}${growth} en 12m`;

  return { total, points, growthLabel };
}

export default async function AdminHome() {
  const [clubsEvo, horsesEvo, ridersEvo, profilesEvo] = await Promise.all([
    monthlyCumulative(schema.clubs, sql`created_at`),
    monthlyCumulative(schema.horses, sql`created_at`),
    monthlyCumulative(schema.riders, sql`created_at`),
    monthlyCumulative(schema.profiles, sql`created_at`),
  ]);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Resumen del sistema"
        description="Cifras totales y crecimiento acumulado de los últimos 12 meses. Cada panel muestra el total al cierre de cada mes."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <EvolutionChart
          title="Clubes"
          total={clubsEvo.total}
          growthLabel={clubsEvo.growthLabel}
          data={clubsEvo.points}
          accent="#3f8649"
        />
        <EvolutionChart
          title="Usuarios"
          total={profilesEvo.total}
          growthLabel={profilesEvo.growthLabel}
          data={profilesEvo.points}
          accent="#1d4ed8"
        />
        <EvolutionChart
          title="Caballos"
          total={horsesEvo.total}
          growthLabel={horsesEvo.growthLabel}
          data={horsesEvo.points}
          accent="#b45309"
        />
        <EvolutionChart
          title="Alumnos"
          total={ridersEvo.total}
          growthLabel={ridersEvo.growthLabel}
          data={ridersEvo.points}
          accent="#be123c"
        />
      </div>

      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      <LegendItem
        icon={<BuildingsIcon size={18} weight="duotone" />}
        label="Clubes operativos"
        hint="Hípicas con cuenta y al menos un usuario."
      />
      <LegendItem
        icon={<UsersIcon size={18} weight="duotone" />}
        label="Usuarios totales"
        hint="Cuentas registradas en Equmanager."
      />
      <LegendItem
        icon={<HorseIcon size={18} weight="duotone" />}
        label="Caballos en gestión"
        hint="Animales dados de alta por los clubes."
      />
      <LegendItem
        icon={<GraduationCapIcon size={18} weight="duotone" />}
        label="Alumnos activos"
        hint="Jinetes con ficha en algún club."
      />
    </div>
  );
}

function LegendItem({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        {icon}
      </span>
      <div>
        <div className="text-xs font-bold text-stone-900">{label}</div>
        <div className="text-[11px] font-medium text-stone-500">{hint}</div>
      </div>
    </div>
  );
}
