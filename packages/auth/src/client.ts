/**
 * Cliente Supabase para componentes de cliente (browser).
 * Usa la cookie sesión + anon key. RLS está activo.
 */
'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      '[@equmanager/auth] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }

  return createBrowserClient(url, key);
}
