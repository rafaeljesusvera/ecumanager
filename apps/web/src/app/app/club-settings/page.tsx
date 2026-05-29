import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import { CLUB_PLANS } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { AutoSaveForm } from '@/components/ui/AutoSaveForm';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { updateClubSettingsAction } from './actions';
import { DirectoryLink } from './DirectoryLink';

export const metadata = { title: 'Ajustes del centro' };
export const dynamic = 'force-dynamic';

export default async function ClubSettingsPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin']);

  // Defensivo: directory_club_id puede no existir aún en BD (migración 0008).
  const [club] = await db
    .select({
      id: schema.clubs.id,
      slug: schema.clubs.slug,
      name: schema.clubs.name,
      plan: schema.clubs.plan,
      settings: schema.clubs.settings,
      createdAt: schema.clubs.createdAt,
      updatedAt: schema.clubs.updatedAt,
    })
    .from(schema.clubs)
    .where(eq(schema.clubs.id, session.primary.clubId))
    .limit(1);

  if (!club) return null;

  let directoryClubId: string | null = null;
  let directoryEntry: typeof schema.directoryClubs.$inferSelect | null = null;
  try {
    const [dirIdRow] = await db
      .select({ directoryClubId: schema.clubs.directoryClubId })
      .from(schema.clubs)
      .where(eq(schema.clubs.id, club.id))
      .limit(1);
    directoryClubId = dirIdRow?.directoryClubId ?? null;
    if (directoryClubId) {
      const [dir] = await db
        .select()
        .from(schema.directoryClubs)
        .where(eq(schema.directoryClubs.id, directoryClubId))
        .limit(1);
      directoryEntry = dir ?? null;
    }
  } catch {
    // migración 0008 pendiente
  }

  const settings = (club.settings as Record<string, unknown>) ?? {};
  const logoUrl = typeof settings.logoUrl === 'string' ? settings.logoUrl : null;
  const phone = typeof settings.phone === 'string' ? settings.phone : '';
  const email = typeof settings.email === 'string' ? settings.email : '';
  const website = typeof settings.website === 'string' ? settings.website : '';
  const address = typeof settings.address === 'string' ? settings.address : '';
  const about = typeof settings.about === 'string' ? settings.about : '';

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Propietario"
        title="Ajustes del centro"
        description="Información pública de tu hípica. Se guarda solo al salir de cada campo."
      />

      <DirectoryLink
        clubName={club.name}
        directoryEntry={directoryEntry}
      />

      <AutoSaveForm
        action={updateClubSettingsAction}
        className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-6"
      >
        <div className="md:col-span-2 md:row-span-3">
          <PhotoUpload
            name="logoUrl"
            folder="clubs"
            defaultValue={logoUrl}
            label="Logo del centro"
          />
        </div>
        <div className="md:col-span-4">
          <Field label="Nombre">
            <Input required name="name" defaultValue={club.name} />
          </Field>
        </div>
        <Field label="Código (slug)">
          <Input
            name="slug"
            defaultValue={club.slug}
            pattern="[a-z0-9][a-z0-9-]*"
          />
        </Field>
        <Field label="Plan">
          <Select name="plan" defaultValue={club.plan}>
            {CLUB_PLANS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Teléfono">
          <Input name="phone" defaultValue={phone} />
        </Field>
        <Field label="Email de contacto">
          <Input name="email" type="email" defaultValue={email} />
        </Field>
        <div className="md:col-span-3">
          <Field label="Web">
            <Input name="website" type="url" defaultValue={website} />
          </Field>
        </div>
        <div className="md:col-span-3">
          <Field label="Dirección">
            <Input name="address" defaultValue={address} />
          </Field>
        </div>
        <div className="md:col-span-6">
          <Field label="Sobre la hípica">
            <Textarea
              name="about"
              rows={3}
              defaultValue={about}
              placeholder="Disciplinas, historia, equipo, instalaciones..."
            />
          </Field>
        </div>
      </AutoSaveForm>
    </div>
  );
}
