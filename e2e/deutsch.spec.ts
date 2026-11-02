import { expect, test } from './basis.ts';

test('Deutsch: Mix startet mit Wortarten, Thema mit Antippen', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Deutsch' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Deutsch' })).toBeVisible();

  // Mix: neue Aufgaben kommen zuerst aus „Wortarten erkennen“ (S. 3), gemischt
  await page.getByRole('button', { name: /Mix für heute/ }).click();
  await expect(page.getByText('Welche Wortart ist das?')).toBeVisible();
  await page.getByRole('button', { name: 'Nomen' }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await page.getByRole('button', { name: 'Weiter →' }).click();
  await expect(page.getByText(/^Aufgabe 2 von [56]$/)).toBeVisible();

  // Zurück zur Startseite und ein Thema mit Antippen wählen
  await page.getByRole('link', { name: 'Startseite' }).click();
  await page.getByRole('button', { name: 'Später weiter' }).click();
  await page.getByRole('link', { name: 'Deutsch' }).click();
  await page.getByRole('button', { name: /Subjekt und Prädikat/ }).click();
  const satz = page.getByRole('group', { name: 'Wörter im Satz' });
  await satz.getByRole('button').first().click();
  await page.getByRole('button', { name: 'Prüfen' }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Weiter →' })).toBeVisible();
});
