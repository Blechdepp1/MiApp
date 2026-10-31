import { test, expect } from '@playwright/test';

test('Startseite lädt', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'MiApp' })).toBeVisible();
});
