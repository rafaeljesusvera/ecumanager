import { test, expect } from '@playwright/test';

/**
 * Flujo completo de un propietario:
 * signup → onboarding → crear caballo → editar → eliminar.
 *
 * Cada ejecución usa un email único para no chocar con sesiones previas
 * (signup usa la service role key y crea el usuario al instante).
 */
test('flujo owner: signup, crear hípica, caballo y borrarlo', async ({ page }) => {
  const stamp = Date.now();
  const email = `pw-owner-${stamp}@equmanager.test`;

  // ── Signup ───────────────────────────────────────────────────────
  await page.goto('/signup');
  await page.getByLabel(/nombre completo/i).fill('PW Owner');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill('Playwright1234!');
  await page.getByRole('button', { name: /crear cuenta/i }).click();

  // ── Onboarding ───────────────────────────────────────────────────
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });
  await page.getByRole('link', { name: /soy propietario de hípica/i }).click();
  await page.getByLabel(/nombre de la hípica/i).fill(`PW Club ${stamp}`);
  await page.getByRole('button', { name: /crear hípica y entrar/i }).click();

  // ── Dashboard ────────────────────────────────────────────────────
  await expect(page).toHaveURL(/\/app/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /hola, pw owner/i })).toBeVisible();

  // ── Crear caballo ────────────────────────────────────────────────
  await page.getByRole('link', { name: /^caballos$/i }).click();
  await expect(page).toHaveURL(/\/app\/horses/);
  // El panel está abierto por defecto (lista vacía)
  await page.getByLabel(/^nombre$/i).fill('Rocinante');
  await page.getByLabel(/^raza$/i).fill('PRE');
  await page.getByRole('button', { name: /crear y abrir ficha/i }).click();

  // ── Detalle caballo ──────────────────────────────────────────────
  await expect(page).toHaveURL(/\/app\/horses\/[a-z0-9-]+$/i, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Rocinante' })).toBeVisible();

  // Autosave: cambiar el nombre y comprobar persistencia tras recarga
  const nameInput = page.getByLabel(/^nombre$/i);
  await nameInput.fill('Rocinante II');
  await nameInput.blur();
  await expect(page.getByText(/guardado/i).first()).toBeVisible({ timeout: 8_000 });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Rocinante II' })).toBeVisible();

  // ── Eliminar con confirmación ────────────────────────────────────
  await page.getByRole('button', { name: /eliminar caballo/i }).click();
  await page.getByRole('button', { name: /sí, eliminar/i }).click();
  await expect(page).toHaveURL(/\/app\/horses$/, { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: 'Rocinante II' })).toHaveCount(0);
});
