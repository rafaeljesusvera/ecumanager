import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import { marked } from 'marked';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import { LogoMark } from '@/components/brand/Logo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article] = await db
    .select({
      title: schema.helpArticles.title,
      summary: schema.helpArticles.summary,
    })
    .from(schema.helpArticles)
    .where(eq(schema.helpArticles.slug, slug))
    .limit(1);
  return {
    title: article?.title ?? 'Ayuda',
    description: article?.summary ?? undefined,
  };
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article] = await db
    .select()
    .from(schema.helpArticles)
    .where(eq(schema.helpArticles.slug, slug))
    .limit(1);
  if (!article) notFound();

  const html = await marked.parse(article.body, { breaks: true });

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={32} />
            <div className="text-sm font-bold text-stone-900">Equmanager</div>
          </Link>
          <Link
            href="/help"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600 hover:text-brand-700"
          >
            Todas las guías
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/help"
          className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
        >
          <ArrowLeftIcon size={12} weight="bold" /> Centro de ayuda
        </Link>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {article.section}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-stone-900 md:text-4xl">
          {article.title}
        </h1>
        {article.summary && (
          <p className="mt-3 text-base font-medium text-stone-600">
            {article.summary}
          </p>
        )}

        <div
          className="prose-equmanager mt-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  );
}
