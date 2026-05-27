import { db, schema } from '@equmanager/database';
import { desc, eq } from 'drizzle-orm';
import {
  NewspaperIcon,
  PlusIcon,
  TrashIcon,
  PushPinIcon,
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
import { formatDate } from '@/lib/format';
import {
  createNewsAction,
  deleteNewsAction,
  togglePinNewsAction,
} from './actions';

export const metadata = { title: 'Noticias' };
export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const list = await db
    .select()
    .from(schema.news)
    .where(eq(schema.news.clubId, session.primary.clubId))
    .orderBy(desc(schema.news.pinned), desc(schema.news.publishedAt));

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Noticias"
        description="Tablón comunicaciones para alumnos, propietarios y mozos."
      />

      <section className="mb-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-bold text-stone-900">
          Publicar noticia
        </h2>
        <form action={createNewsAction} className="space-y-3">
          <Field label="Título">
            <Input
              required
              name="title"
              placeholder="Cambio de horario por puente"
            />
          </Field>
          <Field label="Cuerpo">
            <Textarea
              required
              name="body"
              rows={4}
              placeholder="Detalles que tus alumnos deben saber..."
            />
          </Field>
          <label className="flex items-center gap-2 text-xs font-bold text-stone-700">
            <input type="checkbox" name="pinned" className="h-4 w-4 accent-brand-700" />
            Fijar en tablón
          </label>
          <Button type="submit">
            <PlusIcon size={14} weight="bold" /> Publicar
          </Button>
        </form>
      </section>

      {list.length === 0 ? (
        <EmptyState
          icon={<NewspaperIcon size={40} weight="duotone" />}
          title="Tablón vacío"
          description="Cuando publiques una noticia, todos los miembros la verán en su panel."
        />
      ) : (
        <div className="space-y-3">
          {list.map((n) => (
            <article
              key={n.id}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-stone-900">
                      {n.title}
                    </h3>
                    {n.pinned && (
                      <Badge tone="brand">
                        <PushPinIcon size={10} weight="bold" /> Fijada
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                    {formatDate(n.publishedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <form action={togglePinNewsAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <input
                      type="hidden"
                      name="pinned"
                      value={String(n.pinned)}
                    />
                    <button
                      type="submit"
                      className="rounded-lg p-1.5 text-stone-400 transition hover:bg-brand-50 hover:text-brand-700"
                      title={n.pinned ? 'Quitar fijada' : 'Fijar'}
                    >
                      <PushPinIcon size={16} weight="bold" />
                    </button>
                  </form>
                  <form action={deleteNewsAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      className="rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Eliminar"
                    >
                      <TrashIcon size={16} weight="bold" />
                    </button>
                  </form>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-stone-700">
                {n.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
