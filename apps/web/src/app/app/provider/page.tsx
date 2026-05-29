import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import {
  StethoscopeIcon,
  CalendarBlankIcon,
} from '@phosphor-icons/react/dist/ssr';
import { PROVIDER_SPECIALTIES } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Field, Input, Select, Textarea, EmptyState } from '@/components/ui';
import { AutoSaveForm } from '@/components/ui/AutoSaveForm';
import { updateProviderProfileAction } from './actions';

export const metadata = { title: 'Proveedor' };
export const dynamic = 'force-dynamic';

export default async function ProviderHomePage() {
  const session = await ensureSession();
  assertRole(session, ['provider', 'owner', 'admin']);

  const [profile] = await db
    .select()
    .from(schema.providerProfiles)
    .where(eq(schema.providerProfiles.profileId, session.user.id))
    .limit(1);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Proveedor"
        title="Mi agenda"
        description="Información de tu perfil profesional y próximas visitas (próximamente)."
      />

      <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-3">
          <StethoscopeIcon
            size={22}
            weight="duotone"
            className="text-brand-700"
          />
          <h2 className="text-base font-bold text-stone-900">
            Datos profesionales
          </h2>
        </div>
        <AutoSaveForm
          action={updateProviderProfileAction}
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-6"
        >
          <Field label="Especialidad">
            <Select name="specialty" defaultValue={profile?.specialty ?? 'veterinario'}>
              {PROVIDER_SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Nombre comercial (opcional)">
              <Input
                name="businessName"
                defaultValue={profile?.businessName ?? ''}
                placeholder="Clínica veterinaria Equus"
              />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Teléfono">
              <Input name="phone" defaultValue={profile?.phone ?? ''} />
            </Field>
          </div>
          <div className="md:col-span-6">
            <Field label="Notas (servicios que ofreces, horario, tarifas, etc.)">
              <Textarea
                name="notes"
                rows={3}
                defaultValue={profile?.notes ?? ''}
              />
            </Field>
          </div>
        </AutoSaveForm>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-bold text-stone-900">Próximas visitas</h2>
        <div className="mt-3">
          <EmptyState
            icon={<CalendarBlankIcon size={36} weight="duotone" />}
            title="Aún no hay visitas programadas"
            description="Cuando los propietarios te asignen visitas desde la agenda de cuidados de sus caballos, aparecerán aquí."
          />
        </div>
      </section>
    </div>
  );
}
