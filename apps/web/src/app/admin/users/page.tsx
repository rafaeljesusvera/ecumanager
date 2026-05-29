import { db, schema } from '@equmanager/database';
import { eq, sql } from 'drizzle-orm';
import { PageHeader } from '@/components/page/PageHeader';
import { Avatar, Badge } from '@/components/ui';
import { roleLabel } from '@/lib/db/session';
import type { ClubRole } from '@equmanager/domain';

export const metadata = { title: 'Superadmin · Usuarios' };
export const dynamic = 'force-dynamic';

type UserRow = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  isSuperadmin: boolean | null;
  memberships: Array<{ role: ClubRole; clubName: string }>;
};

export default async function AdminUsersPage() {
  const profiles = await db
    .select({
      id: schema.profiles.id,
      email: schema.profiles.email,
      fullName: schema.profiles.fullName,
      avatarUrl: schema.profiles.avatarUrl,
      createdAt: schema.profiles.createdAt,
    })
    .from(schema.profiles)
    .orderBy(schema.profiles.email);

  // is_superadmin se intenta leer aparte (defensivo si 0007 no aplicado)
  const superMap = new Map<string, boolean>();
  try {
    const su = await db
      .select({
        id: schema.profiles.id,
        isSuperadmin: schema.profiles.isSuperadmin,
      })
      .from(schema.profiles);
    for (const r of su) superMap.set(r.id, r.isSuperadmin ?? false);
  } catch {
    // ok
  }

  const memberships = await db
    .select({
      profileId: schema.clubMembers.profileId,
      role: schema.clubMembers.role,
      clubName: schema.clubs.name,
    })
    .from(schema.clubMembers)
    .innerJoin(schema.clubs, eq(schema.clubs.id, schema.clubMembers.clubId));

  const byProfile = new Map<string, UserRow['memberships']>();
  for (const m of memberships) {
    if (!byProfile.has(m.profileId)) byProfile.set(m.profileId, []);
    byProfile.get(m.profileId)!.push({ role: m.role, clubName: m.clubName });
  }

  const rows: UserRow[] = profiles.map((p) => ({
    ...p,
    isSuperadmin: superMap.get(p.id) ?? false,
    memberships: byProfile.get(p.id) ?? [],
  }));

  // KPIs por rol
  const counts: Record<string, number> = {};
  for (const m of memberships) {
    counts[m.role] = (counts[m.role] ?? 0) + 1;
  }

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Usuarios del sistema"
        description="Cada persona registrada y sus perfiles activos en cada club. Un mismo usuario puede ser propietario en un club y alumno en otro."
      />

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
        <Kpi label="Total usuarios" value={rows.length} />
        <Kpi label="Propietarios hípica" value={counts['owner'] ?? 0} />
        <Kpi label="Administradores" value={counts['admin'] ?? 0} />
        <Kpi label="Instructores" value={counts['instructor'] ?? 0} />
        <Kpi label="Propietarios caballo" value={counts['horse_owner'] ?? 0} />
        <Kpi label="Alumnos" value={counts['rider'] ?? 0} />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            <tr>
              <th className="w-12 px-4 py-3"></th>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Perfiles</th>
              <th className="px-4 py-3 text-left">Alta</th>
              <th className="px-4 py-3 text-left">Sistema</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <Avatar
                    name={u.fullName ?? u.email}
                    src={u.avatarUrl}
                    size="md"
                  />
                </td>
                <td className="px-4 py-3 font-bold text-stone-900">
                  {u.fullName ?? '—'}
                </td>
                <td className="px-4 py-3 text-stone-600">{u.email}</td>
                <td className="px-4 py-3">
                  {u.memberships.length === 0 ? (
                    <span className="text-stone-400">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {u.memberships.map((m, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700"
                          title={`${roleLabel(m.role)} en ${m.clubName}`}
                        >
                          <span className="font-bold text-brand-700">
                            {roleLabel(m.role)}
                          </span>
                          <span className="text-stone-500">·</span>
                          <span className="text-stone-600">{m.clubName}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  {new Date(u.createdAt).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3">
                  {u.isSuperadmin && (
                    <Badge tone="brand">Superadmin</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
        {value}
      </div>
    </div>
  );
}
