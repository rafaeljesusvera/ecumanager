import { test, expect } from '@playwright/test';

test.describe('Landing pública', () => {
  test('muestra el hero y los CTA principales', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /la hípica que se gestiona/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /empezar gratis/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /ver cómo funciona/i }),
    ).toBeVisible();
  });

  test('Centro de ayuda carga el artículo "Cómo empezar"', async ({ page }) => {
    await page.goto('/help');
    await expect(
      page.getByRole('heading', { name: /centro de ayuda/i }),
    ).toBeVisible();
    await page.getByRole('link', { name: /cómo empezar/i }).first().click();
    await expect(
      page.getByRole('heading', { name: /cómo empezar con equmanager/i }),
    ).toBeVisible();
  });

  test('Login redirige no autenticados de /app', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole('heading', { name: /iniciar sesión/i }),
    ).toBeVisible();
  });
});
