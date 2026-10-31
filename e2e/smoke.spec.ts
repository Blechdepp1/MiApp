import { test, expect, type Page } from '@playwright/test';

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

test('Startseite lädt', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible();
});

test('Einstellungen bleiben nach dem Neuladen erhalten', async ({ page }) => {
  await page.goto('./');
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
