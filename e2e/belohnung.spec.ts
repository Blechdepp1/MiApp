import { test, expect, setzePunkte, tippePin, werdeEltern } from './basis.ts';

test('Belohnung einlösen und im Eltern-Bereich bestätigen', async ({ page }) => {
  await page.goto('./');
  await setzePunkte(page, 1000);

  // Kind löst ein
  await page.getByRole('link', { name: 'Belohnungen' }).click();
  await expect(page.getByText('1000 Punkte', { exact: true })).toBeVisible();
  const schwimmbad = page.locator('li', { has: page.locator('strong', { hasText: 'Schwimmbad' }) });
  await schwimmbad.getByRole('button', { name: 'Einlösen' }).click();
  await page.getByRole('button', { name: 'Ja, einlösen!' }).click();
  await expect(page.getByRole('status')).toContainText('Schwimmbad');
  await expect(page.getByText('100 Punkte', { exact: true })).toBeVisible();
  await expect(page.getByText('⏳ wartet auf Bestätigung')).toBeVisible();

  // Level bleibt: Startseite zeigt weiter Level 3 mit 1000 Punkten
  await page.getByRole('link', { name: /Zurück/ }).click();
  await expect(page.getByText('Level 3')).toBeVisible();

  // Eltern bestätigen (auf einem Eltern-Gerät)
  await werdeEltern(page);
  await page.getByRole('link', { name: 'Eltern-Bereich' }).click();
  await tippePin(page);
  await page.getByRole('button', { name: /Einlösungen bestätigen/ }).click();
  await page.getByRole('button', { name: 'Bestätigen' }).click();
  await expect(page.getByText(/Gerade wartet nichts/)).toBeVisible();
  await page.getByRole('button', { name: /Eltern-Bereich/ }).click();

  // Kind sieht die Bestätigung
  await page.getByRole('link', { name: /Zurück/ }).click();
  await page.getByRole('link', { name: 'Belohnungen' }).click();
  await expect(page.getByText('✓ bestätigt')).toBeVisible();
});
