import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const root = '/Users/rafaelveraarroyo/Documents/projects/equmanager/.env';
const ENV = Object.fromEntries(
  readFileSync(root, 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL.replace(/^<|>$/g, '').replace(/\/rest\/v1\/?$/, '');
const SERVICE = ENV.SUPABASE_SERVICE_ROLE_KEY;
const ANON = ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SITE = 'https://equmanager.vercel.app';
const EMAIL = 'rafaelvera@golfmanager.com';
console.log('URL ok:', SUPABASE_URL);

const admin = createClient(SUPABASE_URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL });
if (error) { console.error('generateLink', error); process.exit(1); }
const anon = createClient(SUPABASE_URL, ANON, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: sess, error: vErr } = await anon.auth.verifyOtp({ token_hash: data.properties.hashed_token, type: 'magiclink' });
if (vErr) { console.error('verifyOtp', vErr); process.exit(1); }

const projectRef = SUPABASE_URL.replace(/^https:\/\//, '').split('.')[0];
const cookieName = `sb-${projectRef}-auth-token`;
const value = JSON.stringify({
  access_token: sess.session.access_token,
  refresh_token: sess.session.refresh_token,
  expires_at: sess.session.expires_at,
  expires_in: sess.session.expires_in,
  token_type: 'bearer',
  user: sess.session.user,
});
const b64 = 'base64-' + Buffer.from(value).toString('base64');
console.log('\n--- Probing autenticado como', EMAIL, '---');
for (const p of ['/app', '/admin', '/admin/clubs', '/admin/users', '/admin/directory']) {
  const t = Date.now();
  const r = await fetch(SITE + p, { headers: { cookie: `${cookieName}=${b64}` }, redirect: 'manual' });
  const ms = Date.now() - t;
  const body = r.status === 200 ? await r.text() : '';
  const digest = body.match(/Digest: (\d+)/)?.[1];
  const exception = body.includes('Application error: a server-side exception');
  const flag = exception ? `🔴 SS EXCEPTION digest=${digest}`
    : r.status === 200 ? '🟢 OK'
    : `🟡 ${r.status} → ${r.headers.get('location') ?? ''}`;
  console.log(`${p.padEnd(22)}  ${String(ms).padStart(5)}ms  ${flag}`);
}
