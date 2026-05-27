import { db, schema } from '@equmanager/database';
import { eq, sql } from 'drizzle-orm';
import {
  BookOpenTextIcon,
  PlusIcon,
  TrashIcon,
} from '@phosphor-icons/react/dist/ssr';
import { COURSE_STATUSES, DISCIPLINES } from '@equmanager/domain';
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
import { formatCents, formatDate } from '@/lib/format';
import {
  createCourseAction,
  deleteCourseAction,
  updateCourseStatusAction,
} from './actions';

export const metadata = { title: 'Cursos' };
export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const session = await ensureSession();
  assertRole(session, ['owner', 'admin', 'instructor']);

  const courses = await db
    .select({
      id: schema.courses.id,
      title: schema.courses.title,
      description: schema.courses.description,
      discipline: schema.courses.discipline,
      startDate: schema.courses.startDate,
      endDate: schema.courses.endDate,
      priceCents: schema.courses.priceCents,
      maxStudents: schema.courses.maxStudents,
      status: schema.courses.status,
      enrollments: sql<number>`(
        SELECT count(*)::int FROM enrollments e
        WHERE e.target_type = 'curso' AND e.target_id = ${schema.courses.id}
      )`,
    })
    .from(schema.courses)
    .where(eq(schema.courses.clubId, session.primary.clubId))
    .orderBy(schema.courses.startDate);

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Hípica"
        title="Cursos"
        description="Programas de varias sesiones que tus alumnos pueden comprar y reservar."
      />

      <section className="mb-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-bold text-stone-900">Nuevo curso</h2>
        <form
          action={createCourseAction}
          className="grid grid-cols-1 gap-3 md:grid-cols-6"
        >
          <div className="md:col-span-3">
            <Field label="Título">
              <Input required name="title" placeholder="Iniciación a salto" />
            </Field>
          </div>
          <Field label="Disciplina">
            <Select name="discipline" defaultValue="iniciacion">
              {DISCIPLINES.map((d) => (
                <option key={d} value={d}>
                  {d.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Precio (€)">
            <Input name="price" type="text" placeholder="120" />
          </Field>
          <Field label="Cupo">
            <Input
              name="maxStudents"
              type="number"
              min={1}
              max={200}
              placeholder="12"
            />
          </Field>
          <Field label="Inicio">
            <Input name="startDate" type="date" />
          </Field>
          <Field label="Fin">
            <Input name="endDate" type="date" />
          </Field>
          <div className="md:col-span-4">
            <Field label="Descripción">
              <Textarea
                name="description"
                rows={2}
                placeholder="Resumen de objetivos, lo que se incluye, requisitos..."
              />
            </Field>
          </div>
          <div className="md:col-span-6">
            <Button type="submit">
              <PlusIcon size={14} weight="bold" /> Publicar curso
            </Button>
          </div>
        </form>
      </section>

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpenTextIcon size={40} weight="duotone" />}
          title="Sin cursos publicados"
          description="Crea tu primer curso. Tus alumnos lo verán y podrán apuntarse desde su panel."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <article
              key={c.id}
              className="flex flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                    {c.discipline}
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-stone-900">
                    {c.title}
                  </h3>
                </div>
                <form action={updateCourseStatusAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <AutoSubmitSelect name="status" defaultValue={c.status}>
                    {COURSE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </AutoSubmitSelect>
                </form>
              </div>

              {c.description && (
                <p className="mt-2 text-sm font-medium leading-relaxed text-stone-600">
                  {c.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="brand">{formatCents(c.priceCents)}</Badge>
                {c.maxStudents && (
                  <Badge tone="info">
                    {c.enrollments}/{c.maxStudents} inscritos
                  </Badge>
                )}
                {c.startDate && (
                  <Badge tone="neutral">
                    {formatDate(c.startDate)}
                    {c.endDate ? ` → ${formatDate(c.endDate)}` : ''}
                  </Badge>
                )}
              </div>

              <div className="mt-auto flex items-center justify-end pt-4">
                <form action={deleteCourseAction}>
                  <input type="hidden" name="id" value={c.id} />
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
