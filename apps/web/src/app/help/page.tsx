import Link from 'next/link';
import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import {
  BookOpenTextIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '@phosphor-icons/react/dist/ssr';
import { LogoMark } from '@/components/brand/Logo';

export const metadata = { title: 'Centro de ayuda' };
export const dynamic = 'force-dynamic';

export default async function HelpIndex() {
  const articles = await db
    .select()
    .from(schema.helpArticles)
    .where(eq(schema.helpArticles.published, true))
    .orderBy(schema.helpArticles.section, schema.helpArticles.order);

  const bySection = articles.reduce<Record<string, typeof articles>>((acc, a) => {
    (acc[a.section] ??= []).push(a);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={32} />
            <div className="text-sm font-bold text-stone-900">Equmanager</div>
          </Link>
          <Link
            href="/app"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600 hover:text-brand-700"
          >
            Ir al panel
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
        >
          <ArrowLeftIcon size={12} weight="bold" /> Inicio
        </Link>
        <h1 className="text-3xl font-bold text-stone-900 md:text-4xl">
          Centro de ayuda
        </h1>
        <p className="mt-2 max-w-xl text-sm font-medium text-stone-600">
          Guías cortas para sacar partido a Equmanager. Lee primero{' '}
          <Link
            href="/help/como-empezar"
            className="font-bold text-brand-700 hover:text-brand-900"
          >
            Cómo empezar
          </Link>
          .
        </p>

        <div className="mt-8 space-y-6">
          {Object.entries(bySection).map(([section, list]) => (
            <div key={section}>
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                {section}
              </h2>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {list.map((a) => (
                  <Link
                    key={a.id}
                    href={`/help/${a.slug}`}
                    className="group flex items-center justify-between rounded-3xl border border-stone-200 bg-white p-5 shadow-card transition hover:border-brand-300"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <BookOpenTextIcon
                          size={16}
                          weight="duotone"
                          className="text-brand-700"
                        />
                        <h3 className="text-base font-bold text-stone-900">
                          {a.title}
                        </h3>
                      </div>
                      {a.summary && (
                        <p className="mt-1 line-clamp-2 text-sm font-medium text-stone-600">
                          {a.summary}
                        </p>
                      )}
                    </div>
                    <ArrowRightIcon
                      size={16}
                      className="text-stone-300 group-hover:text-brand-600"
                    />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
