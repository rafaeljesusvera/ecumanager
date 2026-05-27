'use client';

import { useState, type ReactNode } from 'react';
import { PlusIcon, XIcon } from '@phosphor-icons/react/dist/ssr';

/**
 * Panel colapsable para formularios de creación. Por defecto va plegado para
 * dar protagonismo al listado; se expande si no hay registros aún o si el
 * usuario pulsa "Nuevo".
 */
export function CreatePanel({
  label,
  defaultOpen = false,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="mb-8">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-card transition hover:bg-brand-600"
        >
          <PlusIcon size={14} weight="bold" /> {label}
        </button>
      ) : (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">{label}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
              aria-label="Cerrar"
            >
              <XIcon size={16} weight="bold" />
            </button>
          </div>
          {children}
        </div>
      )}
    </section>
  );
}
