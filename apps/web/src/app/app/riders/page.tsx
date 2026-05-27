import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import {
  GraduationCapIcon,
  PlusIcon,
  TrashIcon,
} from '@phosphor-icons/react/dist/ssr';
import { RIDER_CATEGORIES, RIDER_TIERS } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Select,
} from '@/components/ui';
import { createRiderAction, deleteRiderAction } from './actions';

export const metadata = { title: 'Alumnos' };
export const dynamic = 'force-dynamic';

export default async function RidersPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const riders = await db
    .select()
    .from(schema.riders)
    .where(eq(schema.riders.clubId, session.primary.clubId))
    .orderBy(schema.riders.name);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Alumnos"
        description="Tus jinetes y corredores. Pueden estar vinculados a una cuenta o quedar como invitados."
      />

      <section className="mb-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-bold text-stone-900">
          Añadir alumno
        </h2>
        <form
          action={createRiderAction}
          className="grid grid-cols-1 gap-3 md:grid-cols-5"
        >
          <Field label="Nombre">
            <Input required name="name" placeholder="Lucía Pérez" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" placeholder="lucia@correo.com" />
          </Field>
          <Field label="Teléfono">
            <Input name="phone" placeholder="600 000 000" />
          </Field>
          <Field label="Categoría">
            <Select name="category" defaultValue="adulto">
              {RIDER_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nivel">
            <Select name="tier" defaultValue="iniciacion">
              {RIDER_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-5">
            <Button type="submit">
              <PlusIcon size={14} weight="bold" /> Añadir alumno
            </Button>
          </div>
        </form>
      </section>

      {riders.length === 0 ? (
        <EmptyState
          icon={<GraduationCapIcon size={40} weight="duotone" />}
          title="Aún no hay alumnos"
          description="Cuando un alumno se una con tu código de hípica aparecerá aquí. También puedes darlo de alta tú."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Nivel</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {riders.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-bold text-stone-900">
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {r.category.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{r.tier}</td>
                  <td className="px-4 py-3 text-stone-500">
                    {r.email ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={r.status === 'activo' ? 'success' : 'neutral'}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteRiderAction} className="inline-block">
                      <input type="hidden" name="id" value={r.id} />
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
    </div>
  );
}
