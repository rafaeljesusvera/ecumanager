import Link from 'next/link';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui';

/**
 * Layout para páginas de detalle estilo ficha. Cabecera con breadcrumb,
 * título, eyebrow y badge opcional. El contenido viene en secciones que
 * usan <DetailSection>.
 */
export function DetailShell({
  backHref,
  backLabel = 'Volver',
  eyebrow,
  title,
  description,
  status,
  children,
}: {
  backHref: string;
  backLabel?: string;
  eyebrow: string;
  title: string;
  description?: string;
  status?: { label: string; tone?: 'success' | 'neutral' | 'warn' | 'brand' | 'danger' | 'info' };
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 md:p-10">
      <Link
        href={backHref as never}
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
      >
        <ArrowLeftIcon size={12} weight="bold" /> {backLabel}
      </Link>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-stone-900 md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-xl text-sm font-medium text-stone-500">
              {description}
            </p>
          )}
        </div>
        {status && <Badge tone={status.tone}>{status.label}</Badge>}
      </header>

      <div className="space-y-6">{children}</div>
    </div>
  );
}

export function DetailSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-stone-900">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs font-medium text-stone-500">
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </header>
      {children}
    </section>
  );
}
