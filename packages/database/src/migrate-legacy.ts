/**
 * Migración de datos: lee la tabla legacy `club_data` (un JSON por club) y
 * normaliza su contenido a las nuevas tablas relacionales.
 *
 * Uso:
 *   pnpm --filter @equmanager/database tsx src/migrate-legacy.ts <clubCode>
 *
 * Idempotente: usa UPSERTs por slug/clubId+name. Se puede ejecutar varias veces.
 *
 * IMPORTANTE: Este script asume que ya existe un owner para el club (un usuario
 * creado en Supabase Auth con su email). Si no, salta la creación de la
 * membership owner. Se completa manualmente luego desde el panel.
 */
import 'dotenv/config';

import { eq, sql } from 'drizzle-orm';

import { db } from './client';
import {
  clubs,
  horses,
  lessons,
  riders,
} from './schema';

interface LegacyHorse {
  id: string;
  name: string;
  kind?: string;
  status?: string;
  breed?: string | null;
  notes?: string | null;
  ownerId?: string;
}

interface LegacyRider {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  category?: string;
  tier?: string;
  joinDate?: string;
  notes?: string;
  status?: 'activo' | 'baja';
}

interface LegacyLesson {
  id: string;
  date: string;
  discipline?: string;
  status?: string;
  objectives?: string[];
}

interface LegacyClubData {
  clubHorses?: LegacyHorse[];
  clubRiders?: LegacyRider[];
  clubLessons?: LegacyLesson[];
}

const argClubCode = process.argv[2];
if (!argClubCode) {
  console.error('Uso: tsx src/migrate-legacy.ts <clubCode>');
  process.exit(1);
}

async function main() {
  console.log(`📦 Migrando club "${argClubCode}"…`);

  // 1. Leer el JSON legacy. La tabla `club_data` ya existe en Supabase.
  const legacyRows = await db.execute(sql`
    select club_code, data, updated_at
    from public.club_data
    where club_code = ${argClubCode}
    limit 1
  `);

  const legacy = legacyRows[0] as
    | { club_code: string; data: LegacyClubData; updated_at: string }
    | undefined;

  if (!legacy) {
    console.error(`❌ No se encontró club_data con club_code = ${argClubCode}`);
    process.exit(1);
  }

  const data = legacy.data ?? {};
  console.log(
    `   ↳ Encontrado · ${data.clubHorses?.length ?? 0} caballos · ` +
      `${data.clubRiders?.length ?? 0} jinetes · ` +
      `${data.clubLessons?.length ?? 0} clases`,
  );

  // 2. Crear o recuperar el club
  const [club] = await db
    .insert(clubs)
    .values({
      slug: argClubCode,
      name: argClubCode,
    })
    .onConflictDoUpdate({
      target: clubs.slug,
      set: { updatedAt: sql`now()` },
    })
    .returning();

  if (!club) throw new Error('No se pudo crear el club');
  console.log(`   ↳ Club id: ${club.id}`);

  // 3. Caballos
  for (const h of data.clubHorses ?? []) {
    await db
      .insert(horses)
      .values({
        clubId: club.id,
        name: h.name,
        kind: normalizeKind(h.kind),
        status: normalizeHorseStatus(h.status),
        breed: h.breed ?? null,
        notes: h.notes ?? null,
      })
      .onConflictDoNothing();
  }
  console.log(`   ↳ Caballos migrados: ${data.clubHorses?.length ?? 0}`);

  // 4. Jinetes
  for (const r of data.clubRiders ?? []) {
    await db
      .insert(riders)
      .values({
        clubId: club.id,
        name: r.name,
        email: r.email ?? null,
        phone: r.phone ?? null,
        category: normalizeCategory(r.category),
        tier: normalizeTier(r.tier),
        notes: r.notes ?? null,
        status: r.status === 'baja' ? 'baja' : 'activo',
      })
      .onConflictDoNothing();
  }
  console.log(`   ↳ Jinetes migrados: ${data.clubRiders?.length ?? 0}`);

  // 5. Clases (sin instructor: requieren un profile real, se asigna luego)
  // Saltamos las clases en esta primera pasada para mantener invariantes.
  // Se migran manualmente cuando los profiles estén creados.
  console.log(
    `   ↳ Clases pendientes: ${data.clubLessons?.length ?? 0} ` +
      `(requieren mapear instructorId a un profile real)`,
  );

  console.log('✅ Migración completada.');
  process.exit(0);
}

function normalizeKind(s: string | undefined) {
  const v = (s ?? 'caballo').toLowerCase();
  if (v === 'pony') return 'pony';
  if (v === 'shetland') return 'shetland';
  return 'caballo';
}

function normalizeHorseStatus(s: string | undefined) {
  const v = (s ?? 'activo').toLowerCase();
  if (v === 'baja') return 'baja';
  if (v === 'descanso') return 'descanso';
  return 'activo';
}

function normalizeCategory(s: string | undefined) {
  const v = (s ?? 'adulto').toLowerCase().replace(/\s+/g, '_');
  const allowed = [
    'pony_a',
    'pony_b',
    'pony_c',
    'pony_d',
    'infantil',
    'juvenil',
    'adulto',
    'veterano',
  ];
  return (allowed.includes(v) ? v : 'adulto') as 'adulto';
}

function normalizeTier(s: string | undefined) {
  const v = (s ?? 'iniciacion').toLowerCase();
  if (v === 'avanzado') return 'avanzado';
  if (v === 'competicion' || v === 'competición') return 'competicion';
  return 'iniciacion';
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
