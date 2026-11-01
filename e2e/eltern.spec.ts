import { test, expect, tippePin } from './basis.ts';

// Android beendet die App oft, während die Kamera offen ist; danach soll die PIN nicht erneut kommen
test('Eltern-Bereich bleibt nach einem Neuladen offen, nach dem Verlassen nicht', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Eltern-Bereich' }).click();
  await tippePin(page);
  await expect(page.getByRole('heading', { name: 'Lektionen' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Lektionen' })).toBeVisible();

  await page.getByRole('link', { name: /Zurück/ }).click();
  await page.getByRole('link', { name: 'Eltern-Bereich' }).click();
  await expect(page.getByRole('heading', { name: 'Eltern-PIN eingeben' })).toBeVisible();
});
