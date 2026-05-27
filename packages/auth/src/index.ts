export { createClient as createBrowserClient } from './client';
export {
  createClient as createServerClient,
  createAdminClient,
  getCurrentUser,
} from './server';
export type { User, Session } from '@supabase/supabase-js';
