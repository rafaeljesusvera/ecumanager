'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { getCurrentUser } from '@equmanager/auth';
import { CLUB_ROLES, type ClubRole } from '@equmanager/domain';
import { and, eq } from 'drizzle-orm';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

async function ensureProfile(user: { id: string; email: string }) {
  const [existing] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, user.id))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(schema.profiles)
    .values({ id: user.id, email: user.email })
    .returning();
  return created;
}

/**
 * Crea un club nuevo y al usuario como owner.
 */
export async function createClubAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.email) redirect('/login');
  await ensureProfile({ id: user.id, email: user.email });

  const rawName = String(formData.get('name') ?? '').trim();
  if (rawName.length < 2) {
    redirect('/onboarding?error=' + encodeURIComponent('El nombre es muy corto'));
  }

  const baseSlug = slugify(rawName) || `hipica-${Date.now().toString(36)}`;
  let slug = baseSlug;
  let attempt = 0;
  while (attempt < 5) {
    const [taken] = await db
      .select({ id: schema.clubs.id })
      .from(schema.clubs)
      .where(eq(schema.clubs.slug, slug))
      .limit(1);
    if (!taken) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  const [club] = await db
    .insert(schema.clubs)
    .values({ name: rawName, slug })
    .returning();

  if (!club) {
    redirect('/onboarding?error=' + encodeURIComponent('No se pudo crear el club'));
  }

  await db.insert(schema.clubMembers).values({
    clubId: club.id,
    profileId: user.id,
    role: 'owner',
  });

  // Crear una plantilla de cuidados por defecto
  await db.insert(schema.horseCareTemplates).values({
    clubId: club.id,
    name: 'Cuidados diarios',
    description: 'Checklist estándar mañana/tarde para cada caballo.',
    items: [
      { key: 'alimentacion', label: 'Alimentación', kind: 'alimentacion' },
      { key: 'agua', label: 'Agua fresca', kind: 'agua' },
      { key: 'cepillado', label: 'Cepillado', kind: 'cepillado' },
      { key: 'cascos', label: 'Revisión de cascos', kind: 'cascos' },
      { key: 'paddock', label: 'Salida a paddock', kind: 'salida_paddock' },
      { key: 'observaciones', label: 'Observaciones generales', kind: 'observacion_general' },
    ],
  });

  await db.insert(schema.notifications).values({
    profileId: user.id,
    clubId: club.id,
    kind: 'sistema',
    title: '¡Bienvenido a Equmanager!',
    body: `Tu hípica "${club.name}" ya está lista. Empieza añadiendo caballos y alumnos.`,
    link: '/app',
  });

  revalidatePath('/app');
  redirect('/app');
}

/**
 * Une al usuario a un club existente con un rol determinado.
 */
export async function joinClubAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.email) redirect('/login');
  await ensureProfile({ id: user.id, email: user.email });

  const rawSlug = String(formData.get('slug') ?? '')
    .trim()
    .toLowerCase();
  const role = String(formData.get('role') ?? '') as ClubRole;

  if (!CLUB_ROLES.includes(role) || role === 'owner' || role === 'admin') {
    redirect('/onboarding?error=' + encodeURIComponent('Rol no permitido'));
  }

  const [club] = await db
    .select()
    .from(schema.clubs)
    .where(eq(schema.clubs.slug, rawSlug))
    .limit(1);

  if (!club) {
    redirect(
      '/onboarding?error=' +
        encodeURIComponent(
          'No hemos encontrado ese código de hípica. Revísalo con tu profesor.',
        ),
    );
  }

  const [existing] = await db
    .select()
    .from(schema.clubMembers)
    .where(
      and(
        eq(schema.clubMembers.clubId, club.id),
        eq(schema.clubMembers.profileId, user.id),
      ),
    )
    .limit(1);

  if (!existing) {
    await db.insert(schema.clubMembers).values({
      clubId: club.id,
      profileId: user.id,
      role,
    });
  }

  // Si es rider, le creamos su entrada en `riders`
  if (role === 'rider' && !existing) {
    await db.insert(schema.riders).values({
      clubId: club.id,
      profileId: user.id,
      name: (user.user_metadata?.full_name as string) || user.email!,
      email: user.email,
      category: 'adulto',
      tier: 'iniciacion',
    });
  }

  await db.insert(schema.notifications).values({
    profileId: user.id,
    clubId: club.id,
    kind: 'sistema',
    title: `Bienvenido a ${club.name}`,
    body: 'Ya formas parte de la hípica. Echa un vistazo a tu panel.',
    link: '/app',
  });

  revalidatePath('/app');
  redirect('/app');
}
