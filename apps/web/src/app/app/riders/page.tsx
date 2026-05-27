import { db, schema } from '@equmanager/database';
import { getCurrentUser } from '@equmanager/auth';
import { eq } from 'drizzle-orm';

export const metadata = { title: 'Jinetes' };
export const dynamic = 'force-dynamic';

async function getRiders(userId: string) {
  const membership = await db
    .select({ clubId: schema.clubMembers.clubId })
    .from(schema.clubMembers)
    .where(eq(schema.clubMembers.profileId, userId))
    .limit(1);

  if (membership.length === 0 || !membership[0]) return [];

  return db
    .select()
    .from(schema.riders)
    .where(eq(schema.riders.clubId, membership[0].clubId))
    .orderBy(schema.riders.name);
}

export default async function RidersPage() {
  const user = await getCurrentUser();
  const riders = await getRiders(user!.id);

  return (
    <div className="p-6 md:p-10">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
            Tabla
          </p>
          <h1 className="text-3xl font-black text-stone-900">Jinetes</h1>
        </div>
        <button className="rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-brand-300">
          Nuevo
        </button>
      </header>

      {riders.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="text-sm font-bold text-stone-500">
            Aún no hay jinetes registrados.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[10px] font-black uppercase tracking-widest text-stone-500">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Nivel</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {riders.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-black text-stone-900">
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {r.category.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{r.tier}</td>
                  <td className="px-4 py-3 text-stone-500">
                    {r.email ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                        r.status === 'activo'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
