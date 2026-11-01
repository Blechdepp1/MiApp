import { test, expect, type Locator, type Page } from '@playwright/test';
import { tippePin } from './basis.ts';

const LEKTION = {
  id: 'unit-5',
  fach: 'englisch',
  titel: 'Unit 5 – Irregular verbs',
  erstellt: '2026-11-01T10:00:00Z',
  geaendert: '2026-11-01T10:00:00Z',
  inhalt: {
    art: 'vokabeln',
    woerter: [
      { id: 'w1', en: 'began', de: 'anfangen' },
      { id: 'w2', en: 'blew', de: 'pusten' },
    ],
  },
};

// Eltern-Gerät mit einer Lektion einrichten und die Lerninhalte öffnen
async function oeffneLerninhalte(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: /Wir Eltern/ }).click();
  await tippePin(page);
  await tippePin(page);
  await expect(page.getByRole('link', { name: 'Eltern-Bereich' })).toBeVisible();
  await page.evaluate(
    (lektion) =>
      new Promise<void>((fertig) => {
        const anfrage = indexedDB.open('miapp');
        anfrage.onsuccess = () => {
          const tx = anfrage.result.transaction('lektionen', 'readwrite');
          tx.objectStore('lektionen').put(lektion);
          tx.oncomplete = () => {
            anfrage.result.close();
            fertig();
          };
        };
      }),
    LEKTION,
  );
  await page.reload();
  await page.getByRole('link', { name: 'Eltern-Bereich' }).click();
  await tippePin(page);
  await page.getByRole('button', { name: /Lektionen/ }).click();
  await page.getByRole('button', { name: '📚 Lerninhalte verwalten' }).click();
  return page.getByRole('dialog', { name: 'Lerninhalte' });
}

// Nichts ragt am Handy seitlich heraus
async function pruefeKeinSeitlichesScrollen(page: Page) {
  const breite = await page.evaluate(() => {
    const el = document.querySelector('.lerninhalte')!;
    return { inhalt: el.scrollWidth, sichtbar: el.clientWidth };
  });
  expect(breite.inhalt).toBeLessThanOrEqual(breite.sichtbar);
}

async function bearbeiteUndSpeichere(dialog: Locator) {
  await dialog.getByLabel('Deutsch 1').fill('anfangen, beginnen');
  await dialog.getByRole('button', { name: 'Noch nicht dran' }).click();
  await dialog.getByRole('button', { name: 'Speichern' }).click();
  await expect(dialog.getByText('✓ Gespeichert')).toBeVisible();
}

test('Handy: erst die Liste, dann die Lektion', async ({ page }) => {
  const dialog = await oeffneLerninhalte(page);
  const liste = dialog.getByRole('navigation', { name: 'Lektionen' });
  await liste.getByText('Unit 5 – Irregular verbs').click();
  await expect(liste).toBeHidden();
  await pruefeKeinSeitlichesScrollen(page);
  await bearbeiteUndSpeichere(dialog);
  await dialog.getByRole('button', { name: '← Alle Lektionen' }).click();
  await expect(liste.getByRole('heading', { name: 'Noch nicht dran' })).toBeVisible();
  await pruefeKeinSeitlichesScrollen(page);
});

test.describe('PC', () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

  test('Liste und Lektion nebeneinander', async ({ page }) => {
    const dialog = await oeffneLerninhalte(page);
    const liste = dialog.getByRole('navigation', { name: 'Lektionen' });
    await liste.getByText('Unit 5 – Irregular verbs').click();
    await expect(liste).toBeVisible();
    await expect(dialog.getByRole('button', { name: '← Alle Lektionen' })).toBeHidden();
    const [l, d] = await Promise.all([
      liste.boundingBox(),
      dialog.locator('.lerninhalte-detail').boundingBox(),
    ]);
    expect(d!.x).toBeGreaterThan(l!.x + l!.width - 1);
    await bearbeiteUndSpeichere(dialog);
    await expect(liste.getByRole('heading', { name: 'Noch nicht dran' })).toBeVisible();
  });
});
