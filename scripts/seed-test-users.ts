/**
 * Crea (o resetea) un conjunto de usuarios de prueba con un rol cada uno
 * en el club Valdebebas. Idempotente: si los usuarios ya existen, se les
 * resetea la contraseña; las membresías y vínculos se UPSERTean.
 *
 * Uso:
 *   pnpm tsx scripts/seed-test-users.ts
 *
 * Variables requeridas en el .env raíz:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - DATABASE_URL
 */
import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

// Carga el .env desde la raíz del repo, independientemente del cwd
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, '..', '.env') });

const CLUB_SLUG = 'valdebebas';
const PASSWORD = 'Equmanager1!';

const USERS = [
  {
    email: 'owner.demo@equmanager.test',
    name: 'Owner Demo',
    role: 'owner' as const,
  },
  {
    email: 'instructor.demo@equmanager.test',
    name: 'Instructor Demo',
    role: 'instructor' as const,
  },
  {
    email: 'horseowner.demo@equmanager.test',
    name: 'Propietario Demo',
    role: 'horse_owner' as const,
  },
  {
    email: 'rider.demo@equmanager.test',
    name: 'Alumno Demo',
    role: 'rider' as const,
  },
  {
    email: 'groom.demo@equmanager.test',
    name: 'Mozo Demo',
    role: 'groom' as const,
  },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DB_URL = process.env.DATABASE_URL!;

if (!SUPABASE_URL || !SERVICE_ROLE || !DB_URL) {
  console.error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o DATABASE_URL en .env',
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = postgres(DB_URL, { prepare: false, max: 5 });

async function findUserByEmail(email: string): Promise<string | null> {
  // Buscamos paginando hasta encontrarlo
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (found) return found.id;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function ensureAuthUser(email: string, name: string): Promise<string> {
  const existingId = await findUserByEmail(email);
  if (existingId) {
    const { error } = await admin.auth.admin.updateUserById(existingId, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error) throw error;
    return existingId;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) throw error;
  if (!data.user) throw new Error('Sin usuario tras createUser');
  return data.user.id;
}

async function main() {
  // Localiza el club
  const clubRows = await sql<
    { id: string; name: string }[]
  >`SELECT id, name FROM clubs WHERE slug = ${CLUB_SLUG} LIMIT 1`;
  const club = clubRows[0];
  if (!club) {
    console.error(`No se encontró el club con slug "${CLUB_SLUG}".`);
    process.exit(1);
  }
  console.log(`Club: ${club.name} (${club.id})\n`);

  const results: Array<{ email: string; role: string; ok: boolean; extra?: string }> = [];

  for (const u of USERS) {
    try {
      const userId = await ensureAuthUser(u.email, u.name);

      // Profile (upsert por id)
      await sql`
        INSERT INTO profiles (id, email, full_name)
        VALUES (${userId}, ${u.email}, ${u.name})
        ON CONFLICT (id) DO UPDATE
          SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, updated_at = now()
      `;

      // Membership
      await sql`
        INSERT INTO club_members (club_id, profile_id, role)
        VALUES (${club.id}, ${userId}, ${u.role})
        ON CONFLICT (club_id, profile_id) DO UPDATE SET role = EXCLUDED.role
      `;

      let extra: string | undefined;

      // Si es rider, asegura una entrada en la tabla riders
      if (u.role === 'rider') {
        const existing = await sql<
          { id: string }[]
        >`SELECT id FROM riders WHERE club_id = ${club.id} AND profile_id = ${userId} LIMIT 1`;
        if (existing.length === 0) {
          await sql`
            INSERT INTO riders (club_id, profile_id, name, email, category, tier, status)
            VALUES (${club.id}, ${userId}, ${u.name}, ${u.email}, 'adulto', 'iniciacion', 'activo')
          `;
          extra = 'rider entry creada';
        } else {
          extra = 'rider entry existente';
        }
      }

      // Si es propietario de caballo, asígnale uno (el primero sin propietario,
      // y si todos tienen, le añadimos como "authorized" a Sultán)
      if (u.role === 'horse_owner') {
        const free = await sql<
          { id: string; name: string }[]
        >`
          SELECT h.id, h.name FROM horses h
          WHERE h.club_id = ${club.id}
            AND NOT EXISTS (
              SELECT 1 FROM horse_owners ho WHERE ho.horse_id = h.id AND ho.role = 'owner'
            )
          ORDER BY h.name
          LIMIT 1
        `;
        let horse = free[0];
        if (!horse) {
          const fallback = await sql<
            { id: string; name: string }[]
          >`SELECT id, name FROM horses WHERE club_id = ${club.id} ORDER BY name LIMIT 1`;
          horse = fallback[0];
        }
        if (horse) {
          await sql`
            INSERT INTO horse_owners (horse_id, profile_id, role)
            VALUES (${horse.id}, ${userId}, 'owner')
            ON CONFLICT (horse_id, profile_id) DO UPDATE SET role = 'owner'
          `;
          extra = `propietario de "${horse.name}"`;
        } else {
          extra = 'sin caballos disponibles';
        }
      }

      results.push({ email: u.email, role: u.role, ok: true, extra });
    } catch (err) {
      console.error(`✗ ${u.email}:`, err);
      results.push({
        email: u.email,
        role: u.role,
        ok: false,
        extra: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log('\n=== Resultado ===');
  console.log('Contraseña común:', PASSWORD);
  console.log();
  console.log('Rol           Email                              Estado');
  console.log('------------- ---------------------------------- ----------------------');
  for (const r of results) {
    const status = r.ok ? '✓' : '✗';
    console.log(
      `${r.role.padEnd(13)} ${r.email.padEnd(34)} ${status} ${r.extra ?? ''}`,
    );
  }

  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
