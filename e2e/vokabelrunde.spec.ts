import { test, expect } from '@playwright/test';

// Erste Runde mit der Beispielliste: 5 neue Wörter, alles richtig beantworten
const DEUTSCH: Record<string, string> = {
  house: 'Haus',
  school: 'Schule',
  friend: 'Freund, Freundin',
  family: 'Familie',
  brother: 'Bruder',
};

test('eine Vokabelrunde durchspielen', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Vokabeln' }).click();
  await expect(page.getByText('Wort 1 von 5')).toBeVisible();

  for (let i = 1; i <= 5; i++) {
    const englisch = (await page.locator('.uebung-frage > span').last().textContent())!;
    await page.locator('.uebung-option', { hasText: DEUTSCH[englisch]! }).click();
    await expect(page.getByRole('status')).toContainText('Richtig!');
    await page.getByRole('button', { name: 'Weiter →' }).click();
  }

  await expect(page.getByText('+20 Punkte')).toBeVisible();
  await expect(page.getByText(/Tagesziel: 1 von 2 Runden/)).toBeVisible();
  await page.getByRole('link', { name: 'Zur Startseite' }).click();
  await expect(page.getByRole('link', { name: 'Vokabeln' })).toBeVisible();
});
