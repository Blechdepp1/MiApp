import { test, expect } from '@playwright/test';
import { tippePin } from './basis.ts';

// Nachgestellte Antwort der Claude API: Es geht kein Foto und kein echter Schlüssel hinaus
const ANTWORT = {
  id: 'msg_e2e',
  type: 'message',
  role: 'assistant',
  model: 'claude-opus-5-5',
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        woerter: [
          { en: 'began', de: 'anfangen, beginnen', ergaenzt: false },
          { en: 'came', de: 'kommen', ergaenzt: true },
          // Lang: darf auf dem Handy nicht abgeschnitten werden
          {
            en: 'to be (am/is/are) – was/were – been',
            de: 'sein (ich bin, du bist, er/sie/es ist)',
            ergaenzt: false,
          },
        ],
        hinweis: '',
      }),
    },
  ],
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: { input_tokens: 10, output_tokens: 10 },
};

test('Lektion aus einem Foto anlegen (KI nachgestellt)', async ({ page }) => {
  const anfragen: string[] = [];
  await page.route('https://api.anthropic.com/**', async (route) => {
    anfragen.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(ANTWORT),
    });
  });

  // Eltern-Gerät mit Test-Schlüssel (kein echter Schlüssel)
  await page.goto('./');
  await page.getByRole('button', { name: /Wir Eltern/ }).click();
  await tippePin(page);
  await tippePin(page);
  await expect(page.getByRole('link', { name: 'Eltern-Bereich' })).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((fertig) => {
        const a = indexedDB.open('miapp');
        a.onsuccess = () => {
          const tx = a.result.transaction('schluessel', 'readwrite');
          tx.objectStore('schluessel').put({ id: 'ki-schluessel', wert: 'sk-ant-e2e-nur-test' });
          tx.oncomplete = () => {
            a.result.close();
            fertig();
          };
        };
      }),
  );

  await page.getByRole('link', { name: 'Eltern-Bereich' }).click();
  await tippePin(page);
  await page.getByRole('button', { name: /Lektionen/ }).click();
  await page.getByRole('button', { name: '📷 Neue Lektion aus Fotos' }).click();
  await page.getByLabel('Titel').fill('Unit 5 – Irregular verbs');
  await page.getByLabel('🖼️ Aus Galerie').setInputFiles('public/pwa-512.png');
  await page.getByRole('button', { name: 'Fotos auswerten' }).click();

  await expect(page.getByText(/3 Wörter erkannt/)).toBeVisible();
  // Lange Einträge brechen um und das Feld wächst mit, statt Text abzuschneiden
  const lang = page.getByLabel('Deutsch 3');
  await expect(lang).toHaveValue('sein (ich bin, du bist, er/sie/es ist)');
  const masse = await lang.evaluate((f) => ({ voll: f.scrollHeight, sichtbar: f.clientHeight }));
  expect(masse.voll).toBeLessThanOrEqual(masse.sichtbar + 1);
  expect(masse.sichtbar).toBeGreaterThan(40);
  if (process.env.FOTO_BILD) await page.screenshot({ path: process.env.FOTO_BILD });
  await expect(page.getByText(/1 Übersetzung hat die KI ergänzt/)).toBeVisible();
  expect(anfragen.some((u) => u.includes('/v1/messages'))).toBe(true);
  await page.getByRole('button', { name: 'Freigeben' }).click();

  await expect(page.getByText('Unit 5 – Irregular verbs')).toBeVisible();
  await expect(page.getByText('3 Wörter')).toBeVisible();
});
