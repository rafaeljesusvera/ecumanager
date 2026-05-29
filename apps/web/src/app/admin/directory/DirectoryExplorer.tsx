'use client';

import { useMemo, useState } from 'react';
import {
  MagnifyingGlassIcon,
  XCircleIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Badge, Input, Select } from '@/components/ui';

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

export type DirectoryRow = {
  id: string;
  name: string;
  federation: string;
  province: string | null;
  city: string | null;
  website: string | null;
};

export function DirectoryExplorer({ rows }: { rows: DirectoryRow[] }) {
  const [q, setQ] = useState('');
  const [federation, setFederation] = useState('');
  const [province, setProvince] = useState('');
  const [onlyWithWeb, setOnlyWithWeb] = useState(false);

  const federations = useMemo(() => {
    const set = new Set(rows.map((r) => r.federation));
    return Array.from(set).sort();
  }, [rows]);
  const provinces = useMemo(() => {
    const set = new Set(
      rows.map((r) => r.province).filter((p): p is string => !!p),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (federation && r.federation !== federation) return false;
      if (province && r.province !== province) return false;
      if (onlyWithWeb && !r.website) return false;
      if (needle) {
        const hay = `${r.name} ${r.province ?? ''} ${r.city ?? ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, q, federation, province, onlyWithWeb]);

  const hasFilter =
    q.trim().length > 0 || federation || province || onlyWithWeb;

  function clearAll() {
    setQ('');
    setFederation('');
    setProvince('');
    setOnlyWithWeb(false);
  }

  return (
    <>
      <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="relative">
              <MagnifyingGlassIcon
                size={14}
                weight="bold"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar club, provincia o ciudad…"
                className="pl-9"
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <Select
              value={federation}
              onChange={(e) => setFederation(e.target.value)}
            >
              <option value="">Todas las federaciones</option>
              {federations.map((f) => (
                <option key={f} value={f}>
                  {FEDERATION_LABEL[f] ?? f}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-3">
            <Select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
            >
              <option value="">Todas las provincias</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center justify-end md:col-span-1">
            {hasFilter && (
              <button
                type="button"
                onClick={clearAll}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-stone-200 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-600 transition hover:border-red-300 hover:text-red-700"
              >
                <XCircleIcon size={14} weight="bold" />
                Quitar
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyWithWeb((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] transition ${
              onlyWithWeb
                ? 'border-brand-300 bg-brand-50 text-brand-800'
                : 'border-stone-200 bg-white text-stone-600 hover:border-brand-300 hover:text-brand-700'
            }`}
          >
            Con web
          </button>
          <div className="ml-auto text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
            {filtered.length} de {rows.length}
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            <tr>
              <th className="px-4 py-3 text-left">Club</th>
              <th className="px-4 py-3 text-left">Federación</th>
              <th className="px-4 py-3 text-left">Provincia</th>
              <th className="px-4 py-3 text-left">Web</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm font-medium text-stone-500"
                >
                  Sin resultados con esos filtros.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-bold text-stone-900">
                    {r.name}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">
                      {FEDERATION_LABEL[r.federation] ?? r.federation}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {r.province ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {r.website ? (
                      <a
                        href={r.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-700 hover:text-brand-900"
                      >
                        {r.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
