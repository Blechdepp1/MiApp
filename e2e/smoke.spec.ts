import { test, expect, tippePin } from './basis.ts';
import type { Page } from '@playwright/test';

test('Eltern-Bereich öffnet sich nur mit PIN', async ({ page }) => {
  await page.goto('./#/eltern');
  await expect(page.getByRole('heading', { name: 'Eltern-PIN eingeben' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Verbindung' })).toHaveCount(0);
  await tippePin(page, '9999');
  await expect(page.getByRole('alert')).toContainText('Die PIN stimmt nicht.');
  await tippePin(page);
  await expect(page.getByRole('region', { name: 'Verbindung' })).toBeVisible();
});

// Liest die gespeicherten Einstellungen direkt aus IndexedDB
function gespeicherterHintergrund(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string | undefined>((resolve) => {
        const anfrage = indexedDB.open('miapp');
        anfrage.onsuccess = () => {
          const db = anfrage.result;
          if (!db.objectStoreNames.contains('einstellungen')) return resolve(undefined);
          const lesen = db.transaction('einstellungen').objectStore('einstellungen').get('geraet');
          lesen.onsuccess = () => {
            db.close();
            resolve(lesen.result?.hintergrund);
          };
        };
      }),
  );
}

test('Startseite zeigt die Kacheln', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hallo');
  for (const name of ['Vokabeln', 'Belohnungen', 'Einstellungen']) {
    await expect(page.getByRole('link', { name })).toBeVisible();
  }
});

test('Touch-Flächen sind mindestens 48 px groß', async ({ page }) => {
  await page.goto('./');
  const ziele = page.locator('a, button');
  for (let i = 0; i < (await ziele.count()); i++) {
    const box = await ziele.nth(i).boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(48);
    expect(box!.height).toBeGreaterThanOrEqual(48);
  }
});

test('Einstellungen öffnen und zurück zur Startseite', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Einstellungen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Einstellungen' })).toBeVisible();
  await page.getByRole('link', { name: 'Startseite' }).click();
  await expect(page.getByRole('link', { name: 'Vokabeln' })).toBeVisible();
});

test('Einstellungen bleiben nach dem Neuladen erhalten', async ({ page }) => {
  await page.goto('./#/einstellungen');
  const dunkel = page
    .getByRole('radiogroup', { name: 'Hintergrund' })
    .getByRole('radio', { name: 'Dunkel' });
  await dunkel.click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(30, 33, 36)');
  await expect.poll(() => gespeicherterHintergrund(page)).toBe('dunkel');

  await page.reload();
  await expect(dunkel).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(30, 33, 36)');
});
