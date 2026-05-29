import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge } from '@/components/ui';

export const metadata = { title: 'Superadmin · Jinetes' };
export const dynamic = 'force-dynamic';

export default async function AdminRidersPage() {
  const rows = await db
    .select({
      id: schema.riders.id,
      name: schema.riders.name,
      category: schema.riders.category,
      tier: schema.riders.tier,
      status: schema.riders.status,
      clubName: schema.clubs.name,
    })
    .from(schema.riders)
    .innerJoin(schema.clubs, eq(schema.clubs.id, schema.riders.clubId))
    .orderBy(schema.clubs.name, schema.riders.name);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Todos los jinetes"
        description="Alumnos y corredores de todos los clubes."
      />

      <div className="mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            <tr>
              <th className="px-4 py-3 text-left">Club</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Categoría</th>
              <th className="px-4 py-3 text-left">Nivel</th>
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-stone-600">{r.clubName}</td>
                <td className="px-4 py-3 font-bold text-stone-900">{r.name}</td>
                <td className="px-4 py-3 text-stone-600">
                  {r.category.replace(/_/g, ' ')}
                </td>
                <td className="px-4 py-3 text-stone-600">{r.tier}</td>
                <td className="px-4 py-3">
                  <Badge tone={r.status === 'activo' ? 'success' : 'neutral'}>
                    {r.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
