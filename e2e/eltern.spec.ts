import { test, expect, tippePin } from './basis.ts';

// Android beendet die App oft, während die Kamera offen ist; danach soll die PIN nicht erneut kommen
test('Eltern-Bereich bleibt nach einem Neuladen offen, nach dem Verlassen nicht', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Eltern-Bereich' }).click();
  await tippePin(page);
  await page.getByRole('button', { name: /Dropbox & Abgleich/ }).click();
  await expect(page.getByRole('button', { name: 'Mit Dropbox verbinden' })).toBeVisible();

  // Nach dem Neuladen: weiter offen und auf derselben Unterseite
  await page.reload();
  await expect(page.getByRole('button', { name: 'Mit Dropbox verbinden' })).toBeVisible();

  // Zurück-Taste führt erst zur Übersicht, dann zur Startseite
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Eltern-Bereich' })).toBeVisible();

  // Der Zurück-Knopf einer Unterseite führt ebenfalls zur Übersicht
  await page.getByRole('button', { name: /Dropbox & Abgleich/ }).click();
  await page.getByRole('button', { name: /Eltern-Bereich/ }).click();
  await expect(page.getByRole('region', { name: 'Verbindung' })).toBeVisible();

  await page.getByRole('link', { name: /Zurück/ }).click();
  await page.getByRole('link', { name: 'Eltern-Bereich' }).click();
  await expect(page.getByRole('heading', { name: 'Eltern-PIN eingeben' })).toBeVisible();
});
