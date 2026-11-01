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

export const test = basis.extend({
  page: async ({ page }, verwende) => {
    await einrichten(page);
    await verwende(page);
  },
});
