import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para apps/web.
 *
 * - Por defecto corre contra `pnpm dev` lanzado en background. En CI usa
 *   `pnpm start` con el build ya hecho.
 * - `BASE_URL` puede apuntar al deployment de Vercel para smoke tests
 *   contra prod (ej. `BASE_URL=https://equmanager.vercel.app pnpm test:e2e`).
 */
const isCI = !!process.env.CI;
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['html', { open: 'never' }], ['github']] : 'list',

  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});
