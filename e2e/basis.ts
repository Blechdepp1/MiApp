import { test as basis, expect, type Page } from '@playwright/test';

export { expect };

export const TEST_PIN = '1234';

export async function tippePin(page: Page, pin = TEST_PIN) {
  for (const z of pin) await page.getByRole('button', { name: z, exact: true }).click();
}

// Richtet das Gerät ein (Rolle „Kind“, Test-PIN) und verlässt danach die App wieder,
// damit jeder Test mit einem frischen Verlauf auf der Startseite beginnen kann
export async function einrichten(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: /Mein Kind zum Lernen/ }).click();
  await tippePin(page);
  await tippePin(page);
  await expect(page.getByRole('link', { name: 'Vokabeln' })).toBeVisible();
  await page.goto('about:blank');
}

// Macht das Gerät zum Eltern-Gerät (wie das Handy der Eltern) und lädt neu.
// Bestätigen geht nur dort; so lassen sich beide Seiten auf einem Gerät durchspielen.
export async function werdeEltern(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((fertig) => {
        const anfrage = indexedDB.open('miapp');
        anfrage.onsuccess = () => {
          const db = anfrage.result;
          const tx = db.transaction('schluessel', 'readwrite');
          tx.objectStore('schluessel').put({ id: 'geraet-rolle', wert: 'eltern' });
          tx.oncomplete = () => {
            db.close();
            fertig();
          };
        };
      }),
  );
  await page.reload();
}

// Beim ersten Start merkt sich die App das aktuelle Level, ohne zu feiern. Erst danach dürfen
// Punkte dazukommen, sonst gilt das neue Level als „schon gesehen“ (Wettlauf, v. a. im CI).
async function warteAufGesehenesLevel(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<boolean>((fertig) => {
            const anfrage = indexedDB.open('miapp');
            anfrage.onsuccess = () => {
              const db = anfrage.result;
              if (!db.objectStoreNames.contains('schluessel')) {
                db.close();
                return fertig(false);
              }
              const get = db
                .transaction('schluessel')
                .objectStore('schluessel')
                .get('gesehenes-level');
              get.onsuccess = () => {
                db.close();
                fertig(get.result !== undefined);
              };
            };
          }),
      ),
    )
    .toBe(true);
}

// Legt eine frühere Runde mit so vielen Punkten an (gerade Zahl ≥ 10) und lädt neu
export async function setzePunkte(page: Page, punkte: number) {
  await warteAufGesehenesLevel(page);
  await page.evaluate(
    (richtig) =>
      new Promise<void>((fertig) => {
        const anfrage = indexedDB.open('miapp');
        anfrage.onsuccess = () => {
          const db = anfrage.result;
          const tx = db.transaction('ereignisse', 'readwrite');
          tx.objectStore('ereignisse').put({
            id: 'e2e-punkte',
            geraet: 'e2e',
            zeit: new Date(Date.now() - 3 * 86_400_000).toISOString(),
            typ: 'runde-beendet',
            richtig,
            mitHilfe: 0,
            verbessert: 0,
          });
          tx.oncomplete = () => {
            db.close();
            fertig();
          };
        };
      }),
    (punkte - 10) / 2,
  );
  await page.reload();
  // Ab 150 Punkten gibt es einen Level-Aufstieg, dessen Feier die Seite überdeckt
  if (punkte >= 150) await page.getByRole('button', { name: /Juhu/ }).click();
}

export const test = basis.extend({
  page: async ({ page }, verwende) => {
    await einrichten(page);
    await verwende(page);
  },
});
