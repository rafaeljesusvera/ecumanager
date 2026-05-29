'use client';

import { useEffect } from 'react';

const KEY = 'eq_chunk_reload_count';
const MAX_ATTEMPTS = 2;

/**
 * Captura cualquier error no manejado en el árbol (incluido el root
 * layout). Si el error parece un ChunkLoadError tras un deploy nuevo,
 * recarga con cache-buster. Si no, muestra un fallback con un botón
 * de "Recargar".
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const chunkError = isChunkError(error);

  useEffect(() => {
    if (!chunkError) return;
    const raw = sessionStorage.getItem(KEY);
    const attempts = raw ? Number(raw) || 0 : 0;
    if (attempts >= MAX_ATTEMPTS) return;
    sessionStorage.setItem(KEY, String(attempts + 1));
    const url = new URL(window.location.href);
    url.searchParams.set('_v', String(Date.now()));
    window.location.replace(url.toString());
  }, [chunkError]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
          background: '#fafaf9',
          color: '#0c0a09',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#a8a29e',
              marginBottom: 12,
            }}
          >
            Equmanager
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: '0 0 8px',
              letterSpacing: '-0.01em',
            }}
          >
            {chunkError
              ? 'Actualizando la app…'
              : 'Algo ha fallado'}
          </h1>
          <p
            style={{
              fontSize: 14,
              color: '#57534e',
              margin: '0 0 24px',
              lineHeight: 1.5,
            }}
          >
            {chunkError
              ? 'Hay una versión nueva. Vuelvo a cargar la página automáticamente.'
              : 'Recarga para volver a intentarlo. Si vuelve a pasar, escríbenos.'}
          </p>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(KEY);
              reset();
            }}
            style={{
              background: '#0c0a09',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
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
