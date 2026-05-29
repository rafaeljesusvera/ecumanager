'use client';

import { useEffect } from 'react';

const KEY = 'eq_chunk_reload_count';
const MAX_ATTEMPTS = 2;

/**
 * Detecta el ChunkLoadError típico cuando hay un deploy nuevo y el
 * navegador intenta cargar un chunk del bundle anterior (404).
 *
 * - Captura window error / unhandledrejection.
 * - Reintenta hasta MAX_ATTEMPTS veces por sesión, con cache-buster en
 *   la URL para evitar que el navegador sirva HTML cacheado.
 * - Si tras MAX_ATTEMPTS reintentos sigue fallando, deja de recargar
 *   automáticamente para no entrar en bucle (asumimos otra causa).
 */
export function ChunkErrorReloader() {
  useEffect(() => {
    function getAttempts(): number {
      const raw = sessionStorage.getItem(KEY);
      return raw ? Number(raw) || 0 : 0;
    }

    function tryReload() {
      const attempts = getAttempts();
      if (attempts >= MAX_ATTEMPTS) return;
      sessionStorage.setItem(KEY, String(attempts + 1));
      const url = new URL(window.location.href);
      url.searchParams.set('_v', String(Date.now()));
      window.location.replace(url.toString());
    }

    function isChunkError(err: unknown): boolean {
      if (!err) return false;
      const e = err as { name?: string; message?: string };
      const name = e.name ?? '';
      const msg = e.message ?? '';
      return (
        name === 'ChunkLoadError' ||
        /Loading chunk [\w/-]+ failed/i.test(msg) ||
        /Loading CSS chunk/i.test(msg) ||
        /Failed to fetch dynamically imported module/i.test(msg) ||
        /Importing a module script failed/i.test(msg) ||
        /error loading dynamically imported module/i.test(msg) ||
        /Failed to load .*chunk/i.test(msg)
      );
    }

    function onError(ev: ErrorEvent) {
      if (isChunkError(ev.error ?? new Error(ev.message))) {
        tryReload();
      }
    }

    function onRejection(ev: PromiseRejectionEvent) {
      if (isChunkError(ev.reason)) {
        tryReload();
      }
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    // Si llevamos 60s en la página sin más errores, asumimos éxito y
    // reseteamos el contador para futuros incidentes.
    const t = setTimeout(() => sessionStorage.removeItem(KEY), 60_000);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      clearTimeout(t);
    };
  }, []);

  return null;
}
