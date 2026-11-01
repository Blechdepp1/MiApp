import { test, expect, tippePin, werdeEltern } from './basis.ts';

function tag(versatz: number): string {
  const d = new Date();
  d.setDate(d.getDate() + versatz);
  const zwei = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
}

test('Test eintragen, Note nachtragen, Eltern bestätigen', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Tests' }).click();
  await page.getByRole('button', { name: '➕ Test eintragen' }).click();
  await page.getByRole('button', { name: /Mathe/ }).click();
  await page.getByLabel('Wann?').fill(tag(-1));
  await page.getByRole('button', { name: 'Eintragen' }).click();
  await expect(page.getByRole('status')).toContainText('+20 Punkte');

  // Der Termin ist vorbei: Die App fragt nach der Note
  await expect(page.getByRole('heading', { name: 'Wie lief dein Test?' })).toBeVisible();
  await page.getByRole('button', { name: '2', exact: true }).click();
  await expect(page.getByText(/wartet auf Bestätigung/)).toBeVisible();

  // Eltern bestätigen (auf einem Eltern-Gerät)
  await page.getByRole('link', { name: 'Startseite' }).click();
  await werdeEltern(page);
  await page.getByRole('link', { name: 'Eltern-Bereich' }).click();
  await tippePin(page);
  await page.getByRole('button', { name: /Noten bestätigen/ }).click();
  await page.getByRole('button', { name: 'Bestätigen' }).click();
  await expect(page.getByText(/Gerade wartet keine Note/)).toBeVisible();
  await page.getByRole('button', { name: /Eltern-Bereich/ }).click();
  await page.getByRole('link', { name: 'Startseite' }).click();
  // 20 fürs Eintragen + 30 fürs Ergebnis
  await expect(page.getByText(/50 Punkte/)).toBeVisible();
});

test('Rückmeldung schicken und im Eltern-Bereich sehen', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Sag uns was/ }).click();
  await page.getByRole('button', { name: 'Geht so' }).click();
  await page.getByLabel(/Willst du noch etwas sagen/).fill('Mehr Bilder bitte');
  await page.getByRole('button', { name: 'Abschicken' }).click();
  await expect(page.getByRole('status')).toContainText('Danke');
  await page.getByRole('button', { name: 'Schließen' }).click();

  await page.getByRole('link', { name: 'Eltern-Bereich' }).click();
  await tippePin(page);
  await page.getByRole('button', { name: /Neue Rückmeldungen/ }).click();
  await expect(page.getByText('„Mehr Bilder bitte“')).toBeVisible();
  await page.getByRole('button', { name: 'Erledigt' }).click();
  await expect(page.getByText('Keine neuen Rückmeldungen.')).toBeVisible();
});
