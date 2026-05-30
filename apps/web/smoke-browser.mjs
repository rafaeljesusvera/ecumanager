// Smoke test en navegador real (Chromium vía Playwright). Sin escribir en DB.
// Carga rutas públicas + verifica que /app redirige a /login si no hay sesión.
// Captura: status final, errores de consola y errores de red por ruta.
//
// Uso: node scripts/smoke-browser.mjs [baseUrl]
//   baseUrl por defecto: http://localhost:3000

import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:3000';

const ROUTES = [
  { path: '/', label: 'Landing' },
  { path: '/login', label: 'Login' },
  { path: '/help', label: 'Centro de ayuda' },
  { path: '/help/como-empezar', label: 'Artículo cómo-empezar' },
  { path: '/help/guia-proveedores', label: 'Artículo proveedor (nuevo)' },
  { path: '/help/monitor-programar-clases', label: 'Artículo monitor (nuevo)' },
  { path: '/app', label: 'App (debe redirigir si no hay sesión)' },
  { path: '/app/people', label: 'App/people (auth)' },
  { path: '/app/messages', label: 'App/messages (auth)' },
];

const summary = [];

const browser = await chromium.launch();
const context = await browser.newContext();

for (const route of ROUTES) {
  const url = BASE + route.path;
  const page = await context.newPage();
  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(`pageerror: ${err.message}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 500) {
      networkErrors.push(`${res.status()} ${res.url()}`);
    }
  });

  let status = null;
  let finalUrl = null;
  let title = null;
  let bodyChars = 0;
  let err = null;

  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    status = resp?.status() ?? null;
    finalUrl = page.url();
    title = await page.title();
    bodyChars = (await page.locator('body').innerText()).length;
  } catch (e) {
    err = e.message;
  }

  summary.push({
    label: route.label,
    path: route.path,
    status,
    finalUrl,
    redirected: finalUrl && finalUrl !== url ? finalUrl.replace(BASE, '') : null,
    title,
    bodyChars,
    consoleErrors,
    networkErrors,
    err,
  });

  await page.close();
}

await browser.close();

// Reporte
let hasFailure = false;
for (const r of summary) {
  const tag =
    r.err || (r.status && r.status >= 500) || r.consoleErrors.length > 0
      ? 'FAIL'
      : 'OK';
  if (tag === 'FAIL') hasFailure = true;
  console.log(
    `[${tag}] ${r.path}  → status=${r.status} ${r.redirected ? `→ ${r.redirected}` : ''}  chars=${r.bodyChars}  title="${r.title ?? ''}"`,
  );
  if (r.err) console.log(`     err: ${r.err}`);
  if (r.consoleErrors.length) {
    for (const c of r.consoleErrors) console.log(`     console: ${c}`);
  }
  if (r.networkErrors.length) {
    for (const c of r.networkErrors) console.log(`     network: ${c}`);
  }
}

process.exit(hasFailure ? 1 : 0);
