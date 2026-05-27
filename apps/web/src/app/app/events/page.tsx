import { db, schema } from '@equmanager/database';
import { desc, eq, sql } from 'drizzle-orm';
import {
  TrophyIcon,
  PlusIcon,
  TrashIcon,
  MapPinIcon,
} from '@phosphor-icons/react/dist/ssr';
import { EVENT_KINDS, EVENT_STATUSES } from '@equmanager/domain';
import { ensureSession, assertRole } from '@/lib/db';
import { PageHeader } from '@/components/page/PageHeader';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
} from '@/components/ui';
import { AutoSubmitSelect } from '@/components/ui/AutoSubmitSelect';
import { formatCents, formatDateTime } from '@/lib/format';
import {
  createEventAction,
  deleteEventAction,
  updateEventStatusAction,
} from './actions';

export const metadata = { title: 'Eventos' };
export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const events = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      kind: schema.events.kind,
      description: schema.events.description,
      location: schema.events.location,
      startsAt: schema.events.startsAt,
      priceCents: schema.events.priceCents,
      maxAttendees: schema.events.maxAttendees,
      status: schema.events.status,
      enrollments: sql<number>`(
        SELECT count(*)::int FROM enrollments e
        WHERE e.target_type = 'evento' AND e.target_id = ${schema.events.id}
      )`,
    })
    .from(schema.events)
    .where(eq(schema.events.clubId, session.primary.clubId))
    .orderBy(desc(schema.events.startsAt));

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Eventos"
        description="Competiciones, salidas y clinics. Una vez publicado, los alumnos pueden apuntarse."
      />

      <section className="mb-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-bold text-stone-900">Nuevo evento</h2>
        <form
          action={createEventAction}
          className="grid grid-cols-1 gap-3 md:grid-cols-6"
        >
          <div className="md:col-span-3">
            <Field label="Título">
              <Input required name="title" placeholder="Concurso Social Otoño" />
            </Field>
          </div>
          <Field label="Tipo">
            <Select name="kind" defaultValue="competicion">
              {EVENT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha">
            <Input required name="startsAt" type="datetime-local" />
          </Field>
          <Field label="Precio (€)">
            <Input name="price" placeholder="0" />
          </Field>
          <div className="md:col-span-3">
            <Field label="Lugar">
              <Input name="location" placeholder="Pista cubierta" />
            </Field>
          </div>
          <Field label="Cupo">
            <Input name="maxAttendees" type="number" min={1} placeholder="40" />
          </Field>
          <div className="md:col-span-6">
            <Field label="Descripción">
              <Textarea
                name="description"
                rows={2}
                placeholder="Categorías, premios, requisitos..."
              />
            </Field>
          </div>
          <div className="md:col-span-6">
            <Button type="submit">
              <PlusIcon size={14} weight="bold" /> Publicar evento
            </Button>
          </div>
        </form>
      </section>

      {events.length === 0 ? (
        <EmptyState
          icon={<TrophyIcon size={40} weight="duotone" />}
          title="Sin eventos"
          description="Crea tu primer evento para que tus alumnos lo vean en su panel."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => (
            <article
              key={e.id}
              className="flex flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                    {e.kind.replace('_', ' ')}
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-stone-900">
                    {e.title}
                  </h3>
                </div>
                <form action={updateEventStatusAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <AutoSubmitSelect name="status" defaultValue={e.status}>
                    {EVENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </AutoSubmitSelect>
                </form>
              </div>

              {e.description && (
                <p className="mt-2 text-sm font-medium leading-relaxed text-stone-600">
                  {e.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="brand">{formatDateTime(e.startsAt)}</Badge>
                {e.location && (
                  <Badge tone="neutral">
                    <MapPinIcon size={10} weight="bold" /> {e.location}
                  </Badge>
                )}
                <Badge tone="info">{formatCents(e.priceCents)}</Badge>
                {e.maxAttendees && (
                  <Badge tone="warn">
                    {e.enrollments}/{e.maxAttendees}
                  </Badge>
                )}
              </div>

              <div className="mt-auto flex items-center justify-end pt-4">
                <form action={deleteEventAction}>
                  <input type="hidden" name="id" value={e.id} />
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
