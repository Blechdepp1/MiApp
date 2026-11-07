import type { Page } from '@playwright/test';
import { expect, test } from './basis.ts';

// Liest die Aufgabe („7 · 8 = ?“) und rechnet das Ergebnis aus
async function ergebnis(page: Page): Promise<number> {
  const text = (await page.locator('.mathe-aufgabe').first().textContent())!;
  const [, a, op, b] = /(\d+)\s*([·:])\s*(\d+)/.exec(text)!;
  return op === '·' ? Number(a) * Number(b) : Number(a) / Number(b);
}

test('Mathe: Reihe üben, beim zweiten Mal mit dem Ziffernblock', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Mathe' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mathe' })).toBeVisible();
  await page.getByRole('button', { name: /7er-Reihe/ }).click();
  await expect(page.getByText('Du übst jetzt: 7er-Reihe')).toBeVisible();

  // Erste Runde: neue Aufgaben werden ausgewählt
  while (!(await page.getByText(/Geschafft!/).isVisible())) {
    const e = await ergebnis(page);
    await page.locator('.uebung-option', { hasText: new RegExp(`^${e}$`) }).click();
    await expect(page.locator('.runde-rueckmeldung')).toHaveAttribute('data-richtig', 'true');
    await page.getByRole('button', { name: 'Weiter →' }).click();
    // Die Rückmeldung schließt sich (bei der letzten Aufgabe erst mit der Zusammenfassung)
    await expect(page.getByRole('button', { name: 'Weiter →' })).toHaveCount(0);
  }

  // Zweite Runde: Schon Gesehenes wird aus dem Kopf eingetippt
  await page.getByRole('button', { name: 'Noch eine Runde' }).click();
  // Neue und schon geübte Aufgaben sind gemischt: neue auswählen, bis eine geübte kommt
  const block = page.getByRole('group', { name: 'Ziffernblock' });
  while (!(await block.isVisible())) {
    const e = await ergebnis(page);
    await page.locator('.uebung-option', { hasText: new RegExp(`^${e}$`) }).click();
    await page.getByRole('button', { name: 'Weiter →' }).click();
    await expect(page.getByRole('button', { name: 'Weiter →' })).toHaveCount(0);
  }
  const e = await ergebnis(page);
  for (const z of String(e)) await block.getByRole('button', { name: z, exact: true }).click();
  await block.getByRole('button', { name: 'Prüfen' }).click();
  await expect(page.locator('.runde-rueckmeldung')).toHaveAttribute('data-richtig', 'true');
});
