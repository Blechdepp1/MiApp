import { test, expect } from './basis.ts';

test('Nachfrage beim Verlassen einer angefangenen Runde', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Vokabeln' }).click();
  await page.locator('.uebung-option').first().click();

  // Zurück-Taste des Handys: Nachfrage statt Verlassen
  await page.goBack();
  const frage = page.getByRole('dialog', { name: 'Möchtest du aufhören?' });
  await expect(frage).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Vokabeln' })).toBeVisible();

  // Weiter üben: Runde läuft weiter, Nachfrage kommt beim nächsten Mal wieder
  await page.getByRole('button', { name: 'Weiter üben' }).click();
  await expect(frage).toBeHidden();
  // Die Rückmeldung unten deckt die Leiste ab; nach „Weiter“ ist „Startseite“ wieder da
  await page.getByRole('button', { name: 'Weiter →' }).click();
  await page.getByRole('link', { name: 'Startseite' }).click();
  await expect(frage).toBeVisible();

  // Später weiter: zur Startseite, danach verlässt Zurück die App
  await page.getByRole('button', { name: 'Später weiter' }).click();
  await expect(page.getByRole('link', { name: 'Vokabeln' })).toBeVisible();
  await page.goBack();
  expect(page.url()).toBe('about:blank');
});

// Die ersten 5 Wörter der Beispielliste
const DEUTSCH: Record<string, string> = {
  house: 'Haus',
  school: 'Schule',
  friend: 'Freund, Freundin',
  family: 'Familie',
  brother: 'Bruder',
};

test('Nach einer fertigen Runde führt Zurück ohne Nachfrage zur Startseite', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Vokabeln' }).click();
  for (let i = 0; i < 5; i++) {
    const englisch = (await page.locator('.uebung-frage > span').last().textContent())!;
    await page.locator('.uebung-option', { hasText: DEUTSCH[englisch]! }).click();
    await page.getByRole('button', { name: 'Weiter →' }).click();
  }
  await expect(page.getByRole('button', { name: 'Noch eine Runde' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Vokabeln' })).toBeVisible();
});
