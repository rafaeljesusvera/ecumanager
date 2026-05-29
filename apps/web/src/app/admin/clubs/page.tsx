import { db, schema } from '@equmanager/database';
import { eq, sql } from 'drizzle-orm';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge } from '@/components/ui';

export const metadata = { title: 'Superadmin · Clubes' };
export const dynamic = 'force-dynamic';

export default async function AdminClubsPage() {
  const clubs = await db
    .select({
      id: schema.clubs.id,
      name: schema.clubs.name,
      slug: schema.clubs.slug,
      plan: schema.clubs.plan,
      createdAt: schema.clubs.createdAt,
      members: sql<number>`(
        select count(*)::int from club_members cm
        where cm.club_id = ${schema.clubs.id}
      )`,
      horses: sql<number>`(
        select count(*)::int from horses h
        where h.club_id = ${schema.clubs.id}
      )`,
      riders: sql<number>`(
        select count(*)::int from riders r
        where r.club_id = ${schema.clubs.id}
      )`,
    })
    .from(schema.clubs)
    .orderBy(schema.clubs.name);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Clubes operativos"
        description="Cada fila es un club que está usando Equmanager. Para entrar en uno, usa el switcher como propietario."
      />

      <div className="mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            <tr>
              <th className="px-4 py-3 text-left">Club</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-right">Miembros</th>
              <th className="px-4 py-3 text-right">Caballos</th>
              <th className="px-4 py-3 text-right">Jinetes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {clubs.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-bold text-stone-900">{c.name}</td>
                <td className="px-4 py-3 text-stone-600">{c.slug}</td>
                <td className="px-4 py-3">
                  <Badge tone={c.plan === 'enterprise' ? 'brand' : 'neutral'}>
                    {c.plan}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">{c.members}</td>
                <td className="px-4 py-3 text-right">{c.horses}</td>
                <td className="px-4 py-3 text-right">{c.riders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
