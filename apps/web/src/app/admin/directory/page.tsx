import { db, schema } from '@equmanager/database';
import { PageHeader } from '@/components/page/PageHeader';
import {
  DirectoryExplorer,
  type DirectoryRow,
} from './DirectoryExplorer';

export const metadata = { title: 'Superadmin · Directorio' };
export const dynamic = 'force-dynamic';

export default async function AdminDirectoryPage() {
  const data = await db
    .select({
      id: schema.directoryClubs.id,
      name: schema.directoryClubs.name,
      federation: schema.directoryClubs.federation,
      province: schema.directoryClubs.province,
      city: schema.directoryClubs.city,
      website: schema.directoryClubs.website,
    })
    .from(schema.directoryClubs)
    .orderBy(schema.directoryClubs.name);

  const rows: DirectoryRow[] = data.map((r) => ({
    id: r.id,
    name: r.name,
    federation: r.federation,
    province: r.province,
    city: r.city,
    website: r.website,
  }));

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Superadmin"
        title="Directorio público de clubes"
        description={`Datos cargados vía ingesta oficial. ${rows.length} clubes en directorio.`}
      />

      {rows.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-stone-200 bg-white px-4 py-10 text-center text-sm font-medium text-stone-500 shadow-card">
          Aún no hay datos. Ejecuta{' '}
          <code className="rounded bg-stone-100 px-1.5 py-0.5">
            pnpm db:directory-ingest -- ./data/clubs.json
          </code>{' '}
          con el dataset oficial.
        </div>
      ) : (
        <DirectoryExplorer rows={rows} />
      )}
    </div>
  );
}
