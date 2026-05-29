'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ListIcon,
  XIcon,
  ChartBarIcon,
  BuildingsIcon,
  HorseIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
} from '@phosphor-icons/react/dist/ssr';
import { LogoMark } from '@/components/brand/Logo';

const LINKS = [
  { href: '/admin', label: 'Resumen', Icon: ChartBarIcon },
  { href: '/admin/clubs', label: 'Clubes', Icon: BuildingsIcon },
  { href: '/admin/horses', label: 'Caballos', Icon: HorseIcon },
  { href: '/admin/users', label: 'Usuarios', Icon: UsersIcon },
  { href: '/admin/directory', label: 'Directorio público', Icon: MagnifyingGlassIcon },
];

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-700 transition hover:border-brand-300 hover:text-brand-700 md:hidden"
        aria-label="Abrir menú"
      >
        <ListIcon size={18} weight="bold" />
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] md:hidden"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-stone-900/55"
              />
              <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-stone-200 p-4">
                  <div className="flex items-center gap-2">
                    <LogoMark size={28} />
                    <div>
                      <div className="text-sm font-bold text-stone-900">
                        Equmanager
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                        Superadmin
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
                    aria-label="Cerrar"
                  >
                    <XIcon size={18} weight="bold" />
                  </button>
                </div>

                <nav
                  className="flex-1 space-y-0.5 overflow-y-auto p-3"
                  onClick={() => setOpen(false)}
                >
                  {LINKS.map(({ href, label, Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-700 active:bg-stone-100"
                    >
                      <span className="text-stone-400">
                        <Icon size={18} weight="duotone" />
                      </span>
                      {label}
                    </Link>
                  ))}
                </nav>

                <div className="border-t border-stone-200 p-4">
                  <Link
                    href="/app"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-3 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-stone-800"
                  >
                    <ArrowLeftIcon size={12} weight="bold" /> Volver a la app
                  </Link>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
