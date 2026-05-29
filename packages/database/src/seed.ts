/**
 * Seed de desarrollo.
 *
 * Crea un club "demo" con:
 *   - 1 propietario de hípica (centro@demo.eq)
 *   - 1 mozo de cuadra (mozo@demo.eq)
 *   - Una familia García-López con cuentas vinculadas para probar
 *     el switcher de perfiles tipo Google:
 *        · padre@demo.eq → tutor de Lucía e Hijo Menor
 *        · madre@demo.eq → tutora de los mismos
 *        · lucia@demo.eq → rider con cuenta propia (16 años)
 *        · (sin cuenta)  → rider Hijo Menor, gestionado solo por padres
 *
 * Si están definidas las variables de entorno SUPABASE_URL y
 * SUPABASE_SERVICE_ROLE_KEY, también crea las cuentas reales en Supabase
 * Auth (email + password = "demo1234"). En caso contrario, salta esa parte
 * y solo siembra los datos de DB.
 *
 * Uso: pnpm db:seed
 *
 * Solo debe ejecutarse contra una BD local o de staging, NUNCA en producción.
 */
import 'dotenv/config';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { and, eq } from 'drizzle-orm';

import { db } from './client';
import {
  badges,
  clubMembers,
  clubs,
  horses,
  profileLinks,
  profiles,
  riders,
} from './schema';

const DEMO_PASSWORD = 'demo1234';

type SeedUser = {
  email: string;
  fullName: string;
  // Rol primario en el club demo
  role:
    | 'owner'
    | 'admin'
    | 'instructor'
    | 'groom'
    | 'horse_owner'
    | 'rider';
};

const SEED_USERS: SeedUser[] = [
  { email: 'centro@demo.eq', fullName: 'Centro Demo', role: 'owner' },
  { email: 'mozo@demo.eq', fullName: 'Pepe Mozo', role: 'groom' },
  { email: 'padre@demo.eq', fullName: 'Carlos García', role: 'horse_owner' },
  { email: 'madre@demo.eq', fullName: 'Elena López', role: 'horse_owner' },
  { email: 'lucia@demo.eq', fullName: 'Lucía García López', role: 'rider' },
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('🚫 No se puede ejecutar seed en producción.');
    process.exit(1);
  }

  console.log('🌱 Creando datos de ejemplo…');

  // -------------------------------------------------------------------------
  // 1. Club
  // -------------------------------------------------------------------------
  const existingClub = await db
    .select()
    .from(clubs)
    .where(eq(clubs.slug, 'demo'))
    .limit(1);

  let club = existingClub[0];
  if (!club) {
    const [created] = await db
      .insert(clubs)
      .values({ slug: 'demo', name: 'Club Hípico Demo' })
      .returning();
    club = created!;
    console.log('   ↳ Club "demo" creado.');
  } else {
    console.log('   ↳ Club "demo" ya existía.');
  }

  // -------------------------------------------------------------------------
  // 2. Cuentas Supabase (opcional, depende de env)
  // -------------------------------------------------------------------------
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const profileIdByEmail = new Map<string, string>();

  if (supabaseUrl && serviceKey) {
    const admin = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    for (const u of SEED_USERS) {
      // Buscar si ya existe
      const { data: list } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      let user = list?.users.find((x) => x.email === u.email) ?? null;

      if (!user) {
        const { data, error } = await admin.auth.admin.createUser({
          email: u.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: u.fullName },
        });
        if (error) {
          console.error(`   ✖ No se pudo crear ${u.email}: ${error.message}`);
          continue;
        }
        user = data.user;
        console.log(`   ↳ Auth user creado: ${u.email}`);
      } else {
        console.log(`   ↳ Auth user ya existía: ${u.email}`);
      }

      if (user) profileIdByEmail.set(u.email, user.id);
    }

    // Asegurar que el trigger ha creado los profiles. Si no, lo hacemos a mano.
    for (const u of SEED_USERS) {
      const pid = profileIdByEmail.get(u.email);
      if (!pid) continue;
      const existing = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, pid))
        .limit(1);
      if (existing.length === 0) {
        await db
          .insert(profiles)
          .values({ id: pid, email: u.email, fullName: u.fullName });
      }
    }

    // Memberships del club demo
    for (const u of SEED_USERS) {
      const pid = profileIdByEmail.get(u.email);
      if (!pid) continue;
      const existing = await db
        .select()
        .from(clubMembers)
        .where(
          and(
            eq(clubMembers.clubId, club.id),
            eq(clubMembers.profileId, pid),
          ),
        )
        .limit(1);
      if (existing.length === 0) {
        await db
          .insert(clubMembers)
          .values({ clubId: club.id, profileId: pid, role: u.role });
      }
    }
  } else {
    console.log(
      '   ⚠ SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY no definidas: salto creación de auth.users.',
    );
  }

  // -------------------------------------------------------------------------
  // 3. Caballos
  // -------------------------------------------------------------------------
  const existingHorses = await db
    .select()
    .from(horses)
    .where(eq(horses.clubId, club.id));
  if (existingHorses.length === 0) {
    await db.insert(horses).values([
      { clubId: club.id, name: 'Tornado', kind: 'caballo', status: 'activo' },
      { clubId: club.id, name: 'Luna', kind: 'pony', status: 'activo' },
      { clubId: club.id, name: 'Trueno', kind: 'caballo', status: 'descanso' },
      { clubId: club.id, name: 'Pícaro', kind: 'pony', status: 'activo' },
    ]);
    console.log('   ↳ 4 caballos creados.');
  }

  // -------------------------------------------------------------------------
  // 4. Riders (Lucía con profile propio, Hijo Menor sin cuenta)
  // -------------------------------------------------------------------------
  const luciaProfileId = profileIdByEmail.get('lucia@demo.eq') ?? null;
  const padreProfileId = profileIdByEmail.get('padre@demo.eq') ?? null;
  const madreProfileId = profileIdByEmail.get('madre@demo.eq') ?? null;

  const existingRiders = await db
    .select()
    .from(riders)
    .where(eq(riders.clubId, club.id));

  let luciaRiderId: string | null = null;
  let hijoRiderId: string | null = null;

  if (existingRiders.length === 0) {
    const [luciaRider, hijoRider] = await db
      .insert(riders)
      .values([
        {
          clubId: club.id,
          profileId: luciaProfileId,
          name: 'Lucía García López',
          email: 'lucia@demo.eq',
          category: 'juvenil',
          tier: 'avanzado',
        },
        {
          clubId: club.id,
          profileId: null,
          name: 'Hugo García López',
          category: 'pony_c',
          tier: 'iniciacion',
        },
        {
          clubId: club.id,
          name: 'María Soto',
          category: 'adulto',
          tier: 'competicion',
        },
      ])
      .returning();
    luciaRiderId = luciaRider?.id ?? null;
    hijoRiderId = hijoRider?.id ?? null;
    console.log('   ↳ 3 riders creados (Lucía, Hugo, María).');
  } else {
    luciaRiderId =
      existingRiders.find((r) => r.email === 'lucia@demo.eq')?.id ?? null;
    hijoRiderId =
      existingRiders.find((r) => r.name === 'Hugo García López')?.id ?? null;
  }

  // -------------------------------------------------------------------------
  // 5. Vínculos familiares (profile_links)
  // -------------------------------------------------------------------------
  if (padreProfileId && madreProfileId) {
    await ensureLink({
      ownerProfileId: padreProfileId,
      targetProfileId: madreProfileId,
      relation: 'conyuge',
    });
    await ensureLink({
      ownerProfileId: madreProfileId,
      targetProfileId: padreProfileId,
      relation: 'conyuge',
    });
  }
  if (padreProfileId && luciaProfileId) {
    await ensureLink({
      ownerProfileId: padreProfileId,
      targetProfileId: luciaProfileId,
      relation: 'hija',
    });
  }
  if (madreProfileId && luciaProfileId) {
    await ensureLink({
      ownerProfileId: madreProfileId,
      targetProfileId: luciaProfileId,
      relation: 'hija',
    });
  }
  if (padreProfileId && hijoRiderId) {
    await ensureLink({
      ownerProfileId: padreProfileId,
      riderId: hijoRiderId,
      relation: 'hijo',
      label: 'Hugo (menor)',
    });
  }
  if (madreProfileId && hijoRiderId) {
    await ensureLink({
      ownerProfileId: madreProfileId,
      riderId: hijoRiderId,
      relation: 'hijo',
      label: 'Hugo (menor)',
    });
  }
  // Bonus: Lucía también puede ver al hermano pequeño desde su cuenta.
  if (luciaProfileId && hijoRiderId) {
    await ensureLink({
      ownerProfileId: luciaProfileId,
      riderId: hijoRiderId,
      relation: 'otro',
      label: 'Mi hermano',
    });
  }

  // -------------------------------------------------------------------------
  // 6. Insignias
  // -------------------------------------------------------------------------
  const existingBadges = await db
    .select()
    .from(badges)
    .where(eq(badges.clubId, club.id));
  if (existingBadges.length === 0) {
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
    console.log('   ↳ 2 insignias creadas.');
  }

  console.log('✅ Seed completado.');
  console.log('');
  if (profileIdByEmail.size > 0) {
    console.log('Cuentas demo (password: demo1234):');
    for (const u of SEED_USERS) {
      if (profileIdByEmail.has(u.email)) {
        console.log(`   • ${u.email}  (${u.role})`);
      }
    }
    console.log('');
    console.log(
      'Inicia con padre@demo.eq para ver el switcher con: madre, Lucía, Hugo.',
    );
  }
  process.exit(0);
}

async function ensureLink(input: {
  ownerProfileId: string;
  targetProfileId?: string | null;
  riderId?: string | null;
  relation:
    | 'self'
    | 'padre'
    | 'madre'
    | 'tutor'
    | 'conyuge'
    | 'hijo'
    | 'hija'
    | 'secretaria'
    | 'asistente'
    | 'otro';
  label?: string;
}) {
  if (!input.targetProfileId && !input.riderId) return;

  const existing = input.targetProfileId
    ? await db
        .select()
        .from(profileLinks)
        .where(
          and(
            eq(profileLinks.ownerProfileId, input.ownerProfileId),
            eq(profileLinks.targetProfileId, input.targetProfileId),
          ),
        )
        .limit(1)
    : await db
        .select()
        .from(profileLinks)
        .where(
          and(
            eq(profileLinks.ownerProfileId, input.ownerProfileId),
            eq(profileLinks.riderId, input.riderId!),
          ),
        )
        .limit(1);

  if (existing.length > 0) return;

  await db.insert(profileLinks).values({
    ownerProfileId: input.ownerProfileId,
    targetProfileId: input.targetProfileId ?? null,
    riderId: input.riderId ?? null,
    relation: input.relation,
    label: input.label ?? null,
    status: 'activa',
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
