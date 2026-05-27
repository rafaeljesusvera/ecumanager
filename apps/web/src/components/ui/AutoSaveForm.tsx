'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useTransition,
  type FormEvent,
  type ReactNode,
} from 'react';
import { showToast } from './Toast';

type Action = (formData: FormData) => Promise<void> | void;

/**
 * Form de edición con auto-guardado al perder foco.
 * - Detecta blur en inputs/selects/textareas hijos.
 * - Si el valor cambió desde el último guardado, dispara la action.
 * - Muestra toast "Guardando…" → "Guardado ✓".
 */
export function AutoSaveForm({
  action,
  children,
  className,
  silent = false,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  silent?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const lastSerialized = useRef<string>('');
  const [pending, start] = useTransition();

  // Serializa el form actual para detectar cambios
  const serialize = useCallback((): string => {
    if (!formRef.current) return '';
    const fd = new FormData(formRef.current);
    const parts: string[] = [];
    fd.forEach((v, k) => parts.push(`${k}=${typeof v === 'string' ? v : '[file]'}`));
    return parts.sort().join('&');
  }, []);

  // Snapshot inicial cuando se monta
  useEffect(() => {
    lastSerialized.current = serialize();
  }, [serialize]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    triggerSave();
  }

  function triggerSave() {
    if (!formRef.current) return;
    const current = serialize();
    if (current === lastSerialized.current) return;
    const fd = new FormData(formRef.current);
    lastSerialized.current = current;
    if (!silent) showToast('saving', 'Guardando…');
    start(async () => {
      try {
        await action(fd);
        if (!silent) showToast('success', 'Guardado');
      } catch (err) {
        showToast(
          'error',
          err instanceof Error ? err.message : 'Error al guardar',
        );
      }
    });
  }

  function handleBlur(e: React.FocusEvent<HTMLFormElement>) {
    const target = e.target as HTMLElement;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
      // Pequeño defer para que el cambio de value llegue al state del input
      setTimeout(triggerSave, 0);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onBlur={handleBlur}
      className={className}
      data-pending={pending ? 'true' : 'false'}
    >
      {children}
    </form>
  );
}
