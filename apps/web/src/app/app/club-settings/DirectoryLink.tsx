'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  SealCheckIcon,
  XIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui';
import { linkToDirectoryAction, unlinkFromDirectoryAction } from './actions';

const FEDERATION_LABEL: Record<string, string> = {
  rfhe: 'RFHE',
  andalucia: 'Andalucía',
  aragon: 'Aragón',
  asturias: 'Asturias',
  baleares: 'Baleares',
  canarias: 'Canarias',
  cantabria: 'Cantabria',
  castilla_leon: 'Castilla y León',
  castilla_la_mancha: 'Castilla-La Mancha',
  cataluna: 'Cataluña',
  ceuta: 'Ceuta',
  extremadura: 'Extremadura',
  galicia: 'Galicia',
  madrid: 'Madrid',
  melilla: 'Melilla',
  murcia: 'Murcia',
  navarra: 'Navarra',
  pais_vasco: 'País Vasco',
  la_rioja: 'La Rioja',
  valencia: 'Valencia',
};

type DirectorySuggestion = {
  id: string;
  name: string;
  province: string | null;
  federation: string;
  website: string | null;
};

type DirectoryEntry = {
  id: string;
  name: string;
  federation: string;
  province: string | null;
  city: string | null;
  website: string | null;
};

export function DirectoryLink({
  clubName,
  directoryEntry,
}: {
  clubName: string;
  directoryEntry: DirectoryEntry | null;
}) {
  if (directoryEntry) {
    return <LinkedBlock entry={directoryEntry} />;
  }
  return <SearchBlock clubName={clubName} />;
}

function LinkedBlock({ entry }: { entry: DirectoryEntry }) {
  const [pending, start] = useTransition();
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-200 bg-emerald-50/60 px-5 py-4">
      <div className="flex items-start gap-3">
        <SealCheckIcon
          size={28}
          weight="fill"
          className="shrink-0 text-emerald-700"
        />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            Federada · {FEDERATION_LABEL[entry.federation] ?? entry.federation}
          </div>
          <div className="text-sm font-bold text-stone-900">
            {entry.name}
            {entry.province ? ` · ${entry.province}` : ''}
          </div>
          <p className="mt-0.5 text-xs font-medium text-stone-600">
            Tu hípica está vinculada al padrón oficial.
          </p>
        </div>
      </div>
      <form
        action={(fd: FormData) => start(() => unlinkFromDirectoryAction(fd))}
      >
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-700 transition hover:border-red-300 hover:text-red-700 disabled:opacity-50"
        >
          Desvincular
        </button>
      </form>
    </div>
  );
}

function SearchBlock({ clubName }: { clubName: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(clubName);
  const [suggestions, setSuggestions] = useState<DirectorySuggestion[]>([]);
  const [selected, setSelected] = useState<DirectorySuggestion | null>(null);
  const [pending, start] = useTransition();
  const ctrlRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/directory-search?q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal },
        );
        const data: { results: DirectorySuggestion[] } = await res.json();
        setSuggestions(data.results ?? []);
      } catch {
        /* ignore */
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  if (!open) {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-sky-200 bg-sky-50/70 px-5 py-4">
        <div className="flex items-start gap-3">
          <MagnifyingGlassIcon
            size={24}
            weight="duotone"
            className="shrink-0 text-sky-700"
          />
          <div>
            <div className="text-sm font-bold text-stone-900">
              ¿Tu hípica está federada?
            </div>
            <p className="mt-0.5 text-xs font-medium text-stone-600">
              Conéctala con el padrón oficial para que aparezca en el
              buscador público y luzca su federación en las cartas.
            </p>
          </div>
        </div>
        <Button onClick={() => setOpen(true)} variant="outline" size="sm">
          Buscar mi club
        </Button>
      </div>
    );
  }

  function commit() {
    if (!selected) return;
    const fd = new FormData();
    fd.set('directoryClubId', selected.id);
    start(async () => {
      await linkToDirectoryAction(fd);
    });
  }

  return (
    <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-stone-900">
            Buscar mi club en el padrón
          </div>
          <p className="mt-0.5 text-xs font-medium text-stone-600">
            Escribe el nombre y selecciona la entrada que se corresponde.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
          aria-label="Cerrar"
        >
          <XIcon size={14} weight="bold" />
        </button>
      </div>

      <div className="mt-3">
        <div className="relative">
          <MagnifyingGlassIcon
            size={14}
            weight="bold"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (selected) setSelected(null);
            }}
            placeholder="Hípica Valdebebas"
            autoComplete="off"
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 pl-9 text-sm font-medium text-stone-900 outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {suggestions.length > 0 && !selected && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s)}
              className="flex w-full items-center gap-2 border-b border-stone-100 px-3 py-2 text-left last:border-b-0 hover:bg-stone-50"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-stone-900">
                  {s.name}
                </div>
                <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                  {FEDERATION_LABEL[s.federation] ?? s.federation}
                  {s.province ? ` · ${s.province}` : ''}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircleIcon
              size={18}
              weight="fill"
              className="shrink-0 text-emerald-700"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-stone-900">
                {selected.name}
              </div>
              <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                {FEDERATION_LABEL[selected.federation] ?? selected.federation}
                {selected.province ? ` · ${selected.province}` : ''}
              </div>
            </div>
          </div>
          <Button onClick={commit} disabled={pending} size="sm">
            Vincular
          </Button>
        </div>
      )}

      {q.trim().length >= 2 && suggestions.length === 0 && !selected && (
        <p className="mt-3 text-xs font-medium text-stone-500">
          Sin resultados. ¿Está tu club federado a la RFHE o a alguna
          autonómica?
        </p>
      )}
    </div>
  );
}
