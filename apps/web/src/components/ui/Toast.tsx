'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircleIcon,
  WarningCircleIcon,
  SpinnerIcon,
} from '@phosphor-icons/react/dist/ssr';

export type ToastKind = 'success' | 'saving' | 'error';

export type ToastMessage = {
  id: number;
  kind: ToastKind;
  text: string;
};

let listener: ((toast: ToastMessage) => void) | null = null;

export function showToast(kind: ToastKind, text: string) {
  if (listener) listener({ id: Date.now() + Math.random(), kind, text });
}

export function ToastHost() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<ToastMessage[]>([]);

  useEffect(() => {
    setMounted(true);
    listener = (t) => {
      setItems((prev) => [...prev, t]);
      if (t.kind !== 'saving') {
        setTimeout(() => {
          setItems((prev) => prev.filter((x) => x.id !== t.id));
        }, 2200);
      }
    };
    return () => {
      listener = null;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-lg ring-1 ring-black/5 ${
            t.kind === 'success'
              ? 'bg-emerald-600 text-white'
              : t.kind === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-stone-900 text-white'
          }`}
        >
          {t.kind === 'saving' && (
            <SpinnerIcon size={14} weight="bold" className="animate-spin" />
          )}
          {t.kind === 'success' && <CheckCircleIcon size={14} weight="fill" />}
          {t.kind === 'error' && <WarningCircleIcon size={14} weight="fill" />}
          {t.text}
        </div>
      ))}
    </div>,
    document.body,
  );
}
