import { db, schema } from '@equmanager/database';
import { getCurrentUser } from '@equmanager/auth';
import { eq } from 'drizzle-orm';

export const metadata = { title: 'Caballos' };
export const dynamic = 'force-dynamic';

async function getHorses(userId: string) {
  // Toma el primer club del usuario. La selección multi-club vendrá luego.
  const membership = await db
    .select({ clubId: schema.clubMembers.clubId })
    .from(schema.clubMembers)
    .where(eq(schema.clubMembers.profileId, userId))
    .limit(1);

  if (membership.length === 0 || !membership[0]) return [];

  return db
    .select()
    .from(schema.horses)
    .where(eq(schema.horses.clubId, membership[0].clubId))
    .orderBy(schema.horses.name);
}

const statusStyles: Record<string, string> = {
  activo: 'bg-green-100 text-green-800',
  baja: 'bg-stone-200 text-stone-700',
  descanso: 'bg-amber-100 text-amber-800',
};

export default async function HorsesPage() {
  const user = await getCurrentUser();
  const horses = await getHorses(user!.id);

  return (
    <div className="p-6 md:p-10">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
            Tabla
          </p>
          <h1 className="text-3xl font-black text-stone-900">Caballos</h1>
        </div>
        <button className="rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-brand-300">
          Nuevo
        </button>
      </header>

      {horses.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="text-sm font-bold text-stone-500">
            Aún no hay caballos registrados.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[10px] font-black uppercase tracking-widest text-stone-500">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Raza</th>
                <th className="px-4 py-3 text-left">Año</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {horses.map((h) => (
                <tr key={h.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-black text-stone-900">
                    {h.name}
                  </td>
                  <td className="px-4 py-3 capitalize text-stone-700">
                    {h.kind}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{h.breed ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-700">
                    {h.birthYear ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${statusStyles[h.status] ?? 'bg-stone-100'}`}
                    >
                      {h.status}
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
