'use client';

import { useEffect, useRef, useState } from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr';
import { Input } from '@/components/ui';

type Suggestion = {
  id: string;
  name: string;
  province: string | null;
  federation: string;
  website: string | null;
};

/**
 * Autocompleta el nombre de la hípica con el directorio público.
 * Al elegir una sugerencia, rellena el campo y muestra metadatos
 * (federación, provincia) como confirmación visual.
 */
export function ClubNameAutocomplete({
  name = 'name',
  directoryIdName = 'directoryClubId',
  defaultValue = '',
}: {
  name?: string;
  directoryIdName?: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [pinned, setPinned] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pinned) return;
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/directory-search?q=${encodeURIComponent(value)}`,
          { signal: ctrl.signal },
        );
        const data: { results: Suggestion[] } = await res.json();
        setSuggestions(data.results ?? []);
        setOpen(true);
      } catch {
        // ignore aborts
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value, pinned]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function pick(s: Suggestion) {
    setValue(s.name);
    setPinned(s);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="hidden"
        name={directoryIdName}
        value={pinned?.id ?? ''}
      />
      <Input
        required
        name={name}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (pinned && e.target.value !== pinned.name) setPinned(null);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="Hípica Valdebebas"
        autoComplete="off"
      />
      {pinned && (
        <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800">
          Encontrado en {pinned.federation.toUpperCase()}
          {pinned.province ? ` · ${pinned.province}` : ''}
        </div>
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lift">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => pick(s)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-stone-50"
            >
              <MagnifyingGlassIcon
                size={14}
                weight="bold"
                className="mt-0.5 shrink-0 text-stone-400"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-stone-900">
                  {s.name}
                </div>
                <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                  {s.federation.replace('_', ' ')}
                  {s.province ? ` · ${s.province}` : ''}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
