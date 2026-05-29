'use client';

import { useEffect } from 'react';

/**
 * Error boundary temporal para diagnosticar el server-side exception en
 * producción. Muestra el mensaje y stack del error en pantalla.
 *
 * BORRAR cuando se haya identificado y arreglado el problema.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AppError]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h1 className="text-lg font-bold text-red-900">
            Server-side exception
          </h1>
          <p className="mt-1 text-sm font-medium text-red-800">
            Mostrando detalles del error para diagnóstico.
          </p>
          {error.digest && (
            <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-red-700">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            Mensaje
          </div>
          <pre className="mt-2 whitespace-pre-wrap break-words text-xs font-medium text-stone-800">
            {error.message || '(sin mensaje)'}
          </pre>
        </div>

        {error.stack && (
          <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Stack trace
            </div>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-[11px] font-mono leading-relaxed text-stone-700">
              {error.stack}
            </pre>
          </div>
        )}

        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-brand-800"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
