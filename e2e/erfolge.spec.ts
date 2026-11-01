import type { Page } from '@playwright/test';
import { expect, test } from './basis.ts';

// Legt Runden an mehreren Tagen an (Tage zurück ab heute, jeweils Anzahl Runden)
async function legeRundenAn(page: Page, plan: [tageZurueck: number, runden: number][]) {
  await page.goto('./');
  await page.evaluate(
    (plan) =>
      new Promise<void>((fertig) => {
        const anfrage = indexedDB.open('miapp');
        anfrage.onsuccess = () => {
          const db = anfrage.result;
          const tx = db.transaction(['ereignisse', 'schluessel'], 'readwrite');
          // Level-Aufstiege sind schon gefeiert, damit keine Feier die Seite überdeckt
          tx.objectStore('schluessel').put({ id: 'gesehenes-level', wert: 99_000 });
          for (const [zurueck, runden] of plan) {
            for (let r = 0; r < runden; r++) {
              const zeit = new Date();
              zeit.setDate(zeit.getDate() - zurueck);
              zeit.setHours(15 + r, 0, 0, 0);
              tx.objectStore('ereignisse').put({
                id: `e2e-${zurueck}-${r}`,
                geraet: 'e2e',
                zeit: zeit.toISOString(),
                typ: 'runde-beendet',
                richtig: 6 + r,
                mitHilfe: 1,
                verbessert: 0,
              });
            }
          }
          tx.oncomplete = () => {
            db.close();
            fertig();
          };
        };
      }),
    plan,
  );
  await page.reload();
}

test('zeigt Milena ihre Erfolge mit Woche, Kalender und Verlauf', async ({ page }) => {
  await legeRundenAn(page, [
    [0, 2],
    [1, 1],
    [2, 3],
    [4, 1],
    [8, 2],
    [12, 1],
  ]);
  await page.getByRole('link', { name: 'Erfolge' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Meine Erfolge' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Diese Woche' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Heute' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Startseite' })).toBeVisible();
  if (process.env.ERFOLGE_BILD)
    await page.screenshot({ path: process.env.ERFOLGE_BILD, fullPage: true });
});
