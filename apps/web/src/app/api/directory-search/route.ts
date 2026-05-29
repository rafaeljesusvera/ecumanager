/**
 * Búsqueda de clubes en el directorio público (RFHE + autonómicas) para el
 * autocompletar del onboarding del propietario.
 *
 * GET /api/directory-search?q=valdebebas
 */
import { NextResponse } from 'next/server';
import { db, schema } from '@equmanager/database';
import { ilike, or, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const pattern = `%${q}%`;
  const slugPattern = `%${slugify(q)}%`;
  const rows = await db
    .select({
      id: schema.directoryClubs.id,
      name: schema.directoryClubs.name,
      province: schema.directoryClubs.province,
      federation: schema.directoryClubs.federation,
      website: schema.directoryClubs.website,
    })
    .from(schema.directoryClubs)
    .where(
      or(
        ilike(schema.directoryClubs.name, pattern),
        sql`${schema.directoryClubs.searchSlug} ilike ${slugPattern}`,
      ),
    )
    .limit(8);

  return NextResponse.json({ results: rows });
}
