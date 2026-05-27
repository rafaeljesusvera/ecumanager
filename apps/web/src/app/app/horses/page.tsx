import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import { HorseIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react/dist/ssr';
import { HORSE_KINDS, HORSE_STATUSES } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import { Badge, Button, Field, Input, Select, EmptyState } from '@/components/ui';
import { AutoSubmitSelect } from '@/components/ui/AutoSubmitSelect';
import {
  createHorseAction,
  deleteHorseAction,
  updateHorseStatusAction,
} from './actions';

export const metadata = { title: 'Caballos' };
export const dynamic = 'force-dynamic';

const statusTone: Record<string, 'success' | 'neutral' | 'warn'> = {
  activo: 'success',
  baja: 'neutral',
  descanso: 'warn',
};

export default async function HorsesPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const horses = await db
    .select()
    .from(schema.horses)
    .where(eq(schema.horses.clubId, session.primary.clubId))
    .orderBy(schema.horses.name);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Caballos"
        description="Da de alta los caballos del club. Cada uno puede asignarse a un propietario y aparecer en clases."
      />

      <section className="mb-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-bold text-stone-900">
          Añadir caballo
        </h2>
        <form
          action={createHorseAction}
          className="grid grid-cols-1 gap-3 md:grid-cols-5"
        >
          <Field label="Nombre">
            <Input required name="name" placeholder="Sultán" />
          </Field>
          <Field label="Tipo">
            <Select name="kind" defaultValue="caballo">
              {HORSE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Raza">
            <Input name="breed" placeholder="PRE" />
          </Field>
          <Field label="Año">
            <Input
              name="birthYear"
              type="number"
              min={1980}
              max={new Date().getFullYear()}
              placeholder="2018"
            />
          </Field>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              <PlusIcon size={14} weight="bold" /> Añadir
            </Button>
          </div>
        </form>
      </section>

      {horses.length === 0 ? (
        <EmptyState
          icon={<HorseIcon size={40} weight="duotone" />}
          title="Aún no hay caballos"
          description="Empieza por dar de alta uno. Después podrás asignarles propietario, mozos y clases."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Raza</th>
                <th className="px-4 py-3 text-left">Año</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {horses.map((h) => (
                <tr key={h.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-bold text-stone-900">
                    {h.name}
                  </td>
                  <td className="px-4 py-3 capitalize text-stone-700">
                    {h.kind}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{h.breed ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-700">
                    {h.birthYear ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={updateHorseStatusAction}
                      className="inline-flex"
                    >
                      <input type="hidden" name="id" value={h.id} />
                      <AutoSubmitSelect name="status" defaultValue={h.status}>
                        {HORSE_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </AutoSubmitSelect>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteHorseAction} className="inline-block">
                      <input type="hidden" name="id" value={h.id} />
                      <button
                        type="submit"
                        className="rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                      >
                        <TrashIcon size={16} weight="bold" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {horses.length > 0 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
          {Object.entries(statusTone).map(([s, tone]) => {
            const count = horses.filter((h) => h.status === s).length;
            return (
              <Badge key={s} tone={tone}>
                {count} {s}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
