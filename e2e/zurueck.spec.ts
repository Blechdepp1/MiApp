import { test, expect } from './basis.ts';

// Die Zurück-Taste des Handys (Browser-Zurück) führt immer direkt zur Startseite
test('Zurück-Taste führt von jeder Unterseite direkt zur Startseite', async ({ page }) => {
  await page.goto('./');
  const vokabeln = page.getByRole('link', { name: 'Vokabeln' });
  await expect(vokabeln).toBeVisible();

  // Startseite → Einstellungen → (App-Zurück) → Startseite → Vokabeln
  await page.getByRole('link', { name: 'Einstellungen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einstellungen' })).toBeVisible();
  await page.getByRole('link', { name: /Zurück/ }).click();
  await expect(vokabeln).toBeVisible();
  await vokabeln.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vokabeln' })).toBeVisible();

  // Handy-Zurück: direkt zur Startseite, nicht zu den Einstellungen
  await page.goBack();
  await expect(vokabeln).toBeVisible();

  // Noch einmal Zurück verlässt die App (hier: zurück zur leeren Seite vor dem Öffnen)
  await page.goBack();
  expect(page.url()).toBe('about:blank');
});
