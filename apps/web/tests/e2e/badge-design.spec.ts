import { test, expect } from '@playwright/test';

test('diseñar una insignia muestra preview en vivo y crea la ficha', async ({ page }) => {
  const stamp = Date.now();
  const email = `pw-badge-${stamp}@equmanager.test`;

  await page.goto('/signup');
  await page.getByLabel(/nombre completo/i).fill('PW Badge');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill('Playwright1234!');
  await page.getByRole('button', { name: /crear cuenta/i }).click();
  await page.getByRole('link', { name: /soy propietario de hípica/i }).click();
  await page.getByLabel(/nombre de la hípica/i).fill(`PW Badge Club ${stamp}`);
  await page.getByRole('button', { name: /crear hípica y entrar/i }).click();

  await page.getByRole('link', { name: /^insignias$/i }).click();
  await expect(page).toHaveURL(/\/app\/badges/);

  await page.getByLabel(/título grande/i).fill('Mentalidad ganadora');
  await page.getByLabel(/subtítulo/i).fill('Mejor salto');
  await page.getByLabel(/^categoría$/i).fill('U10 | Iniciación');

  // Preview muestra el título en mayúsculas
  await expect(page.getByText(/mentalidad ganadora/i).first()).toBeVisible();

  await page.getByRole('button', { name: /crear insignia/i }).click();
  await expect(page).toHaveURL(/\/app\/badges\/[a-z0-9-]+$/i, { timeout: 15_000 });
  await expect(
    page.getByRole('heading', { name: /mentalidad ganadora/i }),
  ).toBeVisible();
});
