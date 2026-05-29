import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@equmanager/auth';
import { PageHeader } from '@/components/page/PageHeader';
import { UsersExplorer, type UserRow } from './UsersExplorer';

export const metadata = { title: 'Superadmin · Usuarios' };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
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
    id: p.id,
    email: p.email,
    fullName: p.fullName,
    avatarUrl: p.avatarUrl,
    createdAt: p.createdAt.toISOString(),
    isSuperadmin: superMap.get(p.id) ?? false,
    memberships: byProfile.get(p.id) ?? [],
  }));

  const clubs = Array.from(
    new Set(memberships.map((m) => m.clubName)),
  ).sort((a, b) => a.localeCompare(b, 'es'));

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Usuarios del sistema"
        description="Cada persona registrada y sus perfiles activos en cada club. Un mismo usuario puede ser propietario en un club y alumno en otro."
      />

      <UsersExplorer
        users={rows}
        clubs={clubs}
        currentUserId={me?.id ?? ''}
      />
    </div>
  );
}
