import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge } from '@/components/ui';

export const metadata = { title: 'Superadmin · Caballos' };
export const dynamic = 'force-dynamic';

export default async function AdminHorsesPage() {
  const rows = await db
    .select({
      id: schema.horses.id,
      name: schema.horses.name,
      kind: schema.horses.kind,
      status: schema.horses.status,
      clubName: schema.clubs.name,
    })
    .from(schema.horses)
    .innerJoin(schema.clubs, eq(schema.clubs.id, schema.horses.clubId))
    .orderBy(schema.clubs.name, schema.horses.name);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Todos los caballos"
        description="Caballos de todos los clubes del sistema."
      />

      <div className="mt-6 overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            <tr>
              <th className="px-4 py-3 text-left">Club</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((h) => (
              <tr key={h.id}>
                <td className="px-4 py-3 text-stone-600">{h.clubName}</td>
                <td className="px-4 py-3 font-bold text-stone-900">{h.name}</td>
                <td className="px-4 py-3 text-stone-600">{h.kind}</td>
                <td className="px-4 py-3">
                  <Badge tone={h.status === 'activo' ? 'success' : 'neutral'}>
                    {h.status}
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
