/**
 * Ingesta del directorio público de clubes.
 *
 * Lee un fichero JSON con la estructura:
 *   [
 *     {
 *       "externalId": "rfhe-001",
 *       "federation": "rfhe" | "madrid" | "andalucia" | ...,
 *       "name": "Club Hípico de Madrid",
 *       "province": "Madrid",
 *       "city": "Madrid",
 *       "address": "Av. Padre Huidobro s/n",
 *       "postalCode": "28023",
 *       "phone": "+34 91 357 13 44",
 *       "email": "info@chmadrid.es",
 *       "website": "https://chmadrid.es",
 *       "latitude": "40.448",
 *       "longitude": "-3.748",
 *       "sourceUrl": "https://rfhe.com/clubes/...",
 *       "raw": { ... } // opcional, volcado original
 *     },
 *     ...
 *   ]
 *
 * Uso:
 *   pnpm db:directory-ingest -- ./data/clubs-rfhe.json
 *   o
 *   DIRECTORY_FILE=./data/clubs-rfhe.json pnpm db:directory-ingest
 *
 * Upsert por (federation, external_id): se puede re-ejecutar para refrescar.
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { sql } from 'drizzle-orm';

import { db } from './client';
import { directoryClubs } from './schema/directory';
import { SPAIN_FEDERATIONS, type SpainFederation } from '@equmanager/domain';

type IngestRow = {
  externalId: string;
  federation: SpainFederation;
  name: string;
  province?: string | null;
  city?: string | null;
  address?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  sourceUrl?: string | null;
  raw?: Record<string, unknown> | null;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function isFederation(v: unknown): v is SpainFederation {
  return (
    typeof v === 'string' &&
    (SPAIN_FEDERATIONS as readonly string[]).includes(v)
  );
}

async function main() {
  const fileArg =
    process.env.DIRECTORY_FILE ??
    process.argv.slice(2).find((a) => !a.startsWith('-'));
  if (!fileArg) {
    console.error(
      'Uso: pnpm db:directory-ingest -- <ruta-al-fichero.json>\n' +
        'o defina la variable DIRECTORY_FILE=<ruta>.',
    );
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  console.log(`📂 Leyendo ${filePath}…`);

  const content = await readFile(filePath, 'utf8');
  const parsed: unknown = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    console.error('El fichero debe contener un array de objetos.');
    process.exit(1);
  }

  let ok = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [i, item] of parsed.entries()) {
    if (typeof item !== 'object' || item === null) {
      errors.push(`#${i}: no es un objeto`);
      skipped++;
      continue;
    }
    const row = item as Record<string, unknown>;
    const externalId = String(row.externalId ?? '').trim();
    const federation = row.federation;
    const name = String(row.name ?? '').trim();

    if (!externalId || !name) {
      errors.push(`#${i}: faltan externalId o name`);
      skipped++;
      continue;
    }
    if (!isFederation(federation)) {
      errors.push(`#${i}: federation inválida (${String(federation)})`);
      skipped++;
      continue;
    }

    const searchSlug = slugify(name);
    const values = {
      externalId,
      federation,
      name,
      searchSlug,
      province: stringOrNull(row.province),
      city: stringOrNull(row.city),
      address: stringOrNull(row.address),
      postalCode: stringOrNull(row.postalCode),
      phone: stringOrNull(row.phone),
      email: stringOrNull(row.email),
      website: stringOrNull(row.website),
      latitude: stringOrNull(row.latitude),
      longitude: stringOrNull(row.longitude),
      sourceUrl: stringOrNull(row.sourceUrl),
      raw: (row.raw as Record<string, unknown> | undefined) ?? null,
    };

    await db
      .insert(directoryClubs)
      .values(values)
      .onConflictDoUpdate({
        target: [directoryClubs.federation, directoryClubs.externalId],
        set: {
          name: values.name,
          searchSlug: values.searchSlug,
          province: values.province,
          city: values.city,
          address: values.address,
          postalCode: values.postalCode,
          phone: values.phone,
          email: values.email,
          website: values.website,
          latitude: values.latitude,
          longitude: values.longitude,
          sourceUrl: values.sourceUrl,
          raw: values.raw,
          updatedAt: sql`now()`,
        },
      });

    ok++;
  }

  console.log(`✅ Ingestados: ${ok}`);
  if (skipped > 0) {
    console.log(`⚠ Saltados: ${skipped}`);
    for (const e of errors.slice(0, 20)) console.log(`   - ${e}`);
    if (errors.length > 20) console.log(`   ...y ${errors.length - 20} más.`);
  }
  process.exit(0);
}

function stringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
