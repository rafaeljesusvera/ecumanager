import { db, schema } from '@equmanager/database';
import { desc, eq } from 'drizzle-orm';
import {
  TicketIcon,
  PlusIcon,
  TrashIcon,
  PowerIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Textarea,
} from '@/components/ui';
import { formatCents } from '@/lib/format';
import {
  createBonoAction,
  deleteBonoAction,
  toggleBonoActiveAction,
} from './actions';

export const metadata = { title: 'Bonos' };
export const dynamic = 'force-dynamic';

export default async function BonosPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const list = await db
    .select()
    .from(schema.bonos)
    .where(eq(schema.bonos.clubId, session.primary.clubId))
    .orderBy(desc(schema.bonos.active), schema.bonos.priceCents);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Bonos"
        description="Packs de clases prepago. Tus alumnos los compran y la pasarela descuenta cada clase."
      />

      <section className="mb-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-bold text-stone-900">Crear bono</h2>
        <form
          action={createBonoAction}
          className="grid grid-cols-1 gap-3 md:grid-cols-5"
        >
          <div className="md:col-span-2">
            <Field label="Nombre">
              <Input required name="name" placeholder="Bono 10 clases" />
            </Field>
          </div>
          <Field label="Clases">
            <Input
              name="totalClasses"
              type="number"
              defaultValue={10}
              min={1}
              max={200}
            />
          </Field>
          <Field label="Precio (€)">
            <Input name="price" placeholder="250" />
          </Field>
          <Field label="Validez (días)">
            <Input
              name="validityDays"
              type="number"
              defaultValue={180}
              min={7}
            />
          </Field>
          <div className="md:col-span-5">
            <Field label="Descripción">
              <Textarea
                name="description"
                rows={2}
                placeholder="Qué incluye: clases en grupo, individuales, etc."
              />
            </Field>
          </div>
          <div className="md:col-span-5">
            <Button type="submit">
              <PlusIcon size={14} weight="bold" /> Crear bono
            </Button>
          </div>
        </form>
      </section>

      {list.length === 0 ? (
        <EmptyState
          icon={<TicketIcon size={40} weight="duotone" />}
          title="Sin bonos"
          description="Define un par de packs (5 clases, 10 clases) para que tus alumnos puedan comprarlos."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((b) => (
            <article
              key={b.id}
              className="flex flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                    {b.totalClasses} clases · {b.validityDays} días
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-stone-900">
                    {b.name}
                  </h3>
                </div>
                <Badge tone={b.active ? 'success' : 'neutral'}>
                  {b.active ? 'activo' : 'pausado'}
                </Badge>
              </div>
              {b.description && (
                <p className="mt-2 text-sm font-medium leading-relaxed text-stone-600">
                  {b.description}
                </p>
              )}
              <div className="mt-3 text-2xl font-bold text-brand-700">
                {formatCents(b.priceCents)}
              </div>

              <div className="mt-auto flex items-center justify-end gap-1.5 pt-4">
                <form action={toggleBonoActiveAction}>
                  <input type="hidden" name="id" value={b.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={String(b.active)}
                  />
                  <button
                    type="submit"
                    className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
                    title={b.active ? 'Pausar' : 'Activar'}
                  >
                    <PowerIcon size={16} weight="bold" />
                  </button>
                </form>
                <form action={deleteBonoAction}>
                  <input type="hidden" name="id" value={b.id} />
                  <button
                    type="submit"
                    className="rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                    title="Eliminar"
                  >
                    <TrashIcon size={16} weight="bold" />
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
