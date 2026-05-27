/**
 * Cliente Drizzle único.
 *
 * Importante:
 *  - En servidor (Next.js route handlers, server components) usa este cliente
 *    con la service role key cuando necesites bypass de RLS para tareas admin,
 *    o con la anon key + auth.uid() para respetar las policies.
 *  - En el cliente NUNCA importes esto. Usa el SDK de supabase-js, que pasa
 *    por PostgREST y respeta RLS.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    '[@equmanager/database] DATABASE_URL no está definida. Revisa .env.',
  );
}

// Pooler de Supabase: limita el prefetch para no agotar conexiones.
const queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  prepare: false, // Supabase pgbouncer no soporta prepared statements
});

export const db = drizzle(queryClient, { schema, logger: false });

export type Database = typeof db;
