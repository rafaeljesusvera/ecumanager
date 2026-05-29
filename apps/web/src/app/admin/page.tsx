import { db, schema } from '@equmanager/database';
import { sql } from 'drizzle-orm';
import {
  BuildingsIcon,
  HorseIcon,
  GraduationCapIcon,
  UsersIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page/PageHeader';

export const metadata = { title: 'Superadmin · Resumen' };
export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const [clubsCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.clubs);
  const [horsesCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.horses);
  const [ridersCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.riders);
  const [profilesCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.profiles);
  const [directoryCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.directoryClubs);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Resumen del sistema"
        description="Toda la base de datos en una mirada. Cada club ve solo lo suyo desde /app."
      />

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Kpi
          icon={<BuildingsIcon size={22} weight="duotone" />}
          label="Clubes operativos"
          value={clubsCount?.n ?? 0}
        />
        <Kpi
          icon={<HorseIcon size={22} weight="duotone" />}
          label="Caballos"
          value={horsesCount?.n ?? 0}
        />
        <Kpi
          icon={<GraduationCapIcon size={22} weight="duotone" />}
          label="Jinetes"
          value={ridersCount?.n ?? 0}
        />
        <Kpi
          icon={<UsersIcon size={22} weight="duotone" />}
          label="Usuarios"
          value={profilesCount?.n ?? 0}
        />
        <Kpi
          icon={<MagnifyingGlassIcon size={22} weight="duotone" />}
          label="Directorio público"
          value={directoryCount?.n ?? 0}
        />
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
        {value}
      </div>
    </div>
  );
}
