import { db, schema } from '@equmanager/database';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge } from '@/components/ui';

export const metadata = { title: 'Superadmin · Directorio' };
export const dynamic = 'force-dynamic';

const FEDERATION_LABEL: Record<string, string> = {
  rfhe: 'RFHE',
  andalucia: 'Andalucía',
  aragon: 'Aragón',
  asturias: 'Asturias',
  baleares: 'Baleares',
  canarias: 'Canarias',
  cantabria: 'Cantabria',
  castilla_leon: 'Castilla y León',
  castilla_la_mancha: 'Castilla-La Mancha',
  cataluna: 'Cataluña',
  ceuta: 'Ceuta',
  extremadura: 'Extremadura',
  galicia: 'Galicia',
  madrid: 'Madrid',
  melilla: 'Melilla',
  murcia: 'Murcia',
  navarra: 'Navarra',
  pais_vasco: 'País Vasco',
  la_rioja: 'La Rioja',
  valencia: 'Valencia',
};

export default async function AdminDirectoryPage() {
  const rows = await db
    .select()
    .from(schema.directoryClubs)
    .orderBy(schema.directoryClubs.name)
    .limit(500);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Directorio público de clubes"
        description={`Datos cargados via ingesta oficial. ${rows.length} entradas mostradas (máx. 500).`}
      />

      <div className="mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            <tr>
              <th className="px-4 py-3 text-left">Club</th>
              <th className="px-4 py-3 text-left">Federación</th>
              <th className="px-4 py-3 text-left">Provincia</th>
              <th className="px-4 py-3 text-left">Web</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm font-medium text-stone-500"
                >
                  Aún no hay datos. Ejecuta{' '}
                  <code className="rounded bg-stone-100 px-1.5 py-0.5">
                    pnpm db:directory-ingest -- ./data/clubs.json
                  </code>{' '}
                  con el dataset oficial.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-bold text-stone-900">
                    {r.name}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">
                      {FEDERATION_LABEL[r.federation] ?? r.federation}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{r.province}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {r.website ? (
                      <a
                        href={r.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-700 hover:text-brand-900"
                      >
                        {r.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
