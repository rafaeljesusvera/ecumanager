'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ListIcon,
  XIcon,
  SignOutIcon,
} from '@phosphor-icons/react/dist/ssr';
import { signOut } from '@/app/auth/actions';
import { LogoMark } from '@/components/brand/Logo';
import { NavIcon } from './NavIcon';
import type { NavSection } from '@/lib/nav';

export function MobileNav({
  sections,
  clubName,
  roleLabel,
  email,
}: {
  sections: NavSection[];
  clubName: string;
  roleLabel: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquea el scroll del body y cierra con Esc
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
                    <div className="text-sm font-bold text-stone-900">
                      Equmanager
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

                <div className="px-4 py-3">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                      Club activo
                    </div>
                    <div className="text-sm font-bold text-stone-900">
                      {clubName}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-800">
                      {roleLabel}
                    </div>
                  </div>
                </div>

                <nav
                  className="flex-1 space-y-4 overflow-y-auto px-3 pb-4"
                  onClick={() => setOpen(false)}
                >
                  {sections.map((section) => (
                    <div key={section.title}>
                      <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                        {section.title}
                      </div>
                      <div className="space-y-0.5">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-700 active:bg-stone-100"
                          >
                            <span className="text-stone-400">
                              <NavIcon name={item.icon} weight="duotone" />
                            </span>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>

                <div className="border-t border-stone-200 p-4">
                  <div className="truncate pb-2 text-xs font-medium text-stone-600">
                    {email}
                  </div>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-red-700 transition hover:bg-red-100"
                    >
                      <SignOutIcon size={14} weight="bold" /> Cerrar sesión
                    </button>
                  </form>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
