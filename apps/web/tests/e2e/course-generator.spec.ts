import { test, expect } from '@playwright/test';

/**
 * Genera sesiones automáticas de un curso eligiendo días de la semana.
 * Reusa una cuenta owner recién creada para tener la BD limpia.
 */
test('generador de sesiones por días de la semana', async ({ page }) => {
  const stamp = Date.now();
  const email = `pw-course-${stamp}@equmanager.test`;

  // Setup mínimo: cuenta + club
  await page.goto('/signup');
  await page.getByLabel(/nombre completo/i).fill('PW Course');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill('Playwright1234!');
  await page.getByRole('button', { name: /crear cuenta/i }).click();
  await page.getByRole('link', { name: /soy propietario de hípica/i }).click();
  await page.getByLabel(/nombre de la hípica/i).fill(`PW Course Club ${stamp}`);
  await page.getByRole('button', { name: /crear hípica y entrar/i }).click();
  await expect(page).toHaveURL(/\/app$/, { timeout: 15_000 });

  // Crear curso
  await page.getByRole('link', { name: /^cursos$/i }).click();
  await expect(page).toHaveURL(/\/app\/courses/);
  await page.getByLabel(/^título$/i).fill('Iniciación a salto');
  await page.getByLabel(/^precio/i).fill('240');
  await page.getByRole('button', { name: /crear y abrir ficha/i }).click();
  await expect(page).toHaveURL(/\/app\/courses\/[a-z0-9-]+$/i, { timeout: 15_000 });

  // Configurar generador
  const today = new Date();
  const inSixWeeks = new Date(today.getTime() + 42 * 86_400_000);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  await page.getByLabel(/^inicio$/i).first().fill(ymd(today));
  await page.getByLabel(/^fin$/i).first().fill(ymd(inSixWeeks));
  await page.getByLabel(/^hora$/i).fill('17:30');

  // Selecciona Martes y Jueves
  await page.getByRole('button', { name: 'M', exact: true }).click();
  await page.getByRole('button', { name: 'J', exact: true }).click();

  await expect(page.getByText(/se crearán \d+ sesion/i)).toBeVisible();

  await page.getByRole('button', { name: /^generar \d+/i }).click();

  await expect(page.getByText(/sesion(es)? generada/i)).toBeVisible({
    timeout: 15_000,
  });
});
