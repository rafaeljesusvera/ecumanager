/**
 * Seed de desarrollo. Crea un club ejemplo con caballos, jinetes y un
 * instructor ficticio para poder arrancar la app vacía.
 *
 * Uso: pnpm db:seed
 *
 * Solo debe ejecutarse contra una BD local o de staging, NUNCA en producción.
 */
import 'dotenv/config';

import { db } from './client';
import { badges, clubs, horses, riders } from './schema';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('🚫 No se puede ejecutar seed en producción.');
    process.exit(1);
  }

  console.log('🌱 Creando datos de ejemplo…');

  const [club] = await db
    .insert(clubs)
    .values({
      slug: 'demo',
      name: 'Club Hípico Demo',
    })
    .onConflictDoNothing()
    .returning();

  if (!club) {
    console.log('   ↳ Club "demo" ya existe, saltando.');
    process.exit(0);
  }

  await db.insert(horses).values([
    { clubId: club.id, name: 'Tornado', kind: 'caballo', status: 'activo' },
    { clubId: club.id, name: 'Luna', kind: 'pony', status: 'activo' },
    { clubId: club.id, name: 'Trueno', kind: 'caballo', status: 'descanso' },
  ]);

  await db.insert(riders).values([
    {
      clubId: club.id,
      name: 'María García',
      category: 'infantil',
      tier: 'iniciacion',
    },
    {
      clubId: club.id,
      name: 'Carlos López',
      category: 'adulto',
      tier: 'avanzado',
    },
  ]);

  await db.insert(badges).values([
    {
      clubId: club.id,
      code: 'first_canter',
      name: 'Primer galope',
      color: '#fbbf24',
    },
    {
      clubId: club.id,
      code: 'first_jump',
      name: 'Primer salto',
      color: '#10b981',
    },
  ]);

  console.log('✅ Seed completado.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
