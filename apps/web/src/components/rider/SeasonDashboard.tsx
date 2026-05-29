import Link from 'next/link';
import {
  TrophyIcon,
  CalendarBlankIcon,
  MapPinIcon,
  SealCheckIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui';
import type { SeasonStats } from '@/lib/competition-data';

const STATUS_LABEL: Record<string, string> = {
  inscrito: 'Inscrita',
  pre_inscrito: 'Pre-inscrita',
  siguiente: 'En el calendario',
};

const STATUS_TONE: Record<string, 'success' | 'info' | 'neutral'> = {
  inscrito: 'success',
  pre_inscrito: 'info',
  siguiente: 'neutral',
};

export function SeasonDashboard({
  stats,
  riderName,
}: {
  stats: SeasonStats;
  riderName: string;
}) {
  return (
    <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/40 p-5 shadow-card md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-800">
            <SealCheckIcon size={11} weight="fill" /> Tu temporada
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
            Mi calendario federado
          </h2>
          <p className="mt-1 text-xs font-medium text-stone-600">
            {stats.category}
            {stats.rfheLicense ? ` · Licencia ${stats.rfheLicense}` : ''}
          </p>
        </div>
        {stats.ranking && (
          <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-right shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              {stats.ranking.tour}
            </div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              #{stats.ranking.position}
              <span className="ml-1 text-sm font-bold text-stone-500">
                / {stats.ranking.total}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Próximas pruebas */}
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
            Próximas pruebas
          </h3>
          <ul className="mt-2 space-y-2">
            {stats.upcoming.map((e, i) => {
              const d = new Date(e.date);
              return (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-white p-3"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                    <div className="text-[10px] font-bold uppercase tracking-widest">
                      {d.toLocaleDateString('es-ES', { month: 'short' })}
                    </div>
                    <div className="text-lg font-bold leading-none">
                      {d.getDate()}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-stone-900">
                      {e.title}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      <MapPinIcon size={10} weight="bold" /> {e.venue}
                      <span className="text-stone-300">·</span>
                      {e.category}
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[e.status]}>
                    {STATUS_LABEL[e.status]}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Resultados recientes */}
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
            Resultados recientes
          </h3>
          <ul className="mt-2 space-y-2">
            {stats.results.slice(0, 4).map((r, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-white p-3"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-sm font-bold ${
                    r.position && r.position <= 3
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {r.position ? `${r.position}º` : '—'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-stone-900">
                    {r.title}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    {r.category} · {r.horse}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-stone-900">
                    {r.faults ?? 0} pts
                  </div>
                  {r.time && (
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      {r.time}s
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {stats.bestRound && (
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 px-3 py-2">
              <div className="flex items-center gap-2">
                <TrophyIcon size={16} weight="duotone" className="text-amber-700" />
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-800">
                  Mejor manga
                </div>
              </div>
              <div className="text-xs font-bold text-stone-900">
                {stats.bestRound.faults} pts · {stats.bestRound.time}s ·{' '}
                {stats.bestRound.venue}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
