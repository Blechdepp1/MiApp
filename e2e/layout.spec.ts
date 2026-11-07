import { test, expect, setzePunkte, tippePin, werdeEltern } from './basis.ts';
import { pruefeLayout, setzeDarstellung, type Darstellung } from './layout.ts';
import type { Page } from '@playwright/test';

// Layout-Regressionstests: geometrische Prüfungen statt Bildvergleich (siehe layout.ts).
// Jede Ansicht in zwei Darstellungen: Standard und „größte Schrift + weiter Abstand + OpenDyslexic“.

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

const VERBEN = {
  id: 'verben-1',
  fach: 'englisch',
  titel: 'Unregelmäßige Verben',
  erstellt: '2026-11-02T10:00:00Z',
  geaendert: '2026-11-02T10:00:00Z',
  inhalt: {
    art: 'verben',
    verben: [
      { id: 'begin', de: 'anfangen, beginnen', formen: ['begin', 'began', 'begun'] },
      { id: 'be', de: 'sein', formen: ['be', 'was, were', 'been'] },
      { id: 'bring', de: 'bringen', formen: ['bring', 'brought', 'brought'] },
    ],
  },
};

async function legeLektionAn(page: Page) {
  await page.evaluate(
    (lektionen) =>
      new Promise<void>((fertig) => {
        const anfrage = indexedDB.open('miapp');
        anfrage.onsuccess = () => {
          const tx = anfrage.result.transaction('lektionen', 'readwrite');
          for (const lektion of lektionen) tx.objectStore('lektionen').put(lektion);
          tx.oncomplete = () => {
            anfrage.result.close();
            fertig();
          };
        };
      }),
    [LEKTION, VERBEN],
  );
}

// Startseite mit Punkten, damit der Level-Balken samt Text „Noch … Punkte bis …“ erscheint
async function startseite(page: Page, darstellung: Darstellung) {
  await page.goto('./');
  await setzeDarstellung(page, darstellung);
  await setzePunkte(page, 60);
  await expect(page.getByText(/Noch \d+ Punkte/)).toBeVisible();
}

async function elternBereich(page: Page, darstellung: Darstellung) {
  await startseite(page, darstellung);
  await legeLektionAn(page);
  await werdeEltern(page);
  await page.getByRole('link', { name: 'Eltern-Bereich' }).click();
  await tippePin(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Eltern-Bereich' })).toBeVisible();
}

async function lerninhalte(page: Page, darstellung: Darstellung) {
  await elternBereich(page, darstellung);
  await page.getByRole('button', { name: /Lektionen/ }).click();
  await page.getByRole('button', { name: '📚 Lerninhalte verwalten' }).click();
  const dialog = page.getByRole('dialog', { name: 'Lerninhalte' });
  await expect(dialog).toBeVisible();
  return dialog;
}

const ANSICHTEN: Record<string, (page: Page, darstellung: Darstellung) => Promise<void>> = {
  Startseite: startseite,

  '„Sag uns was“': async (page, d) => {
    await startseite(page, d);
    await page.getByRole('button', { name: /Sag uns was/ }).click();
    await expect(page.getByRole('dialog', { name: 'Sag uns was' })).toBeVisible();
  },

  'Vokabeln, Auswahl': async (page, d) => {
    await startseite(page, d);
    await page.getByRole('link', { name: 'Vokabeln' }).click();
    await expect(page.getByRole('button', { name: /Mix für heute/ })).toBeVisible();
  },

  'Vokabelrunde, Frage': async (page, d) => {
    await startseite(page, d);
    await page.getByRole('link', { name: 'Vokabeln' }).click();
    await page.getByRole('button', { name: /Mix für heute/ }).click();
    await expect(page.getByText('Wort 1 von 5')).toBeVisible();
  },

  'Vokabelrunde, Rückmeldung': async (page, d) => {
    await startseite(page, d);
    await page.getByRole('link', { name: 'Vokabeln' }).click();
    await page.getByRole('button', { name: /Mix für heute/ }).click();
    await page.locator('.uebung-option').first().click();
    await expect(page.getByRole('button', { name: 'Weiter →' })).toBeVisible();
  },

  'Deutsch, Auswahl': async (page, d) => {
    await startseite(page, d);
    await page.getByRole('link', { name: 'Deutsch' }).click();
    await expect(page.getByRole('button', { name: /Mix für heute/ })).toBeVisible();
  },

  'Deutsch, Antippen': async (page, d) => {
    await startseite(page, d);
    await page.getByRole('link', { name: 'Deutsch' }).click();
    await page.getByRole('button', { name: /Wortarten im Text/ }).click();
    await expect(page.getByRole('group', { name: 'Wörter im Satz' })).toBeVisible();
  },

  'Deutsch, Rückmeldung': async (page, d) => {
    await startseite(page, d);
    await page.getByRole('link', { name: 'Deutsch' }).click();
    await page.getByRole('button', { name: /Adjektive: Gegenteil/ }).click();
    // Die Aufgaben sind gemischt: Im Adjektiv-Thema wird immer geschrieben
    await page.getByRole('textbox').fill('xyz');
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expect(page.getByRole('button', { name: 'Weiter →' })).toBeVisible();
  },

  'Mathe, Auswahl': async (page, d) => {
    await startseite(page, d);
    await page.getByRole('link', { name: 'Mathe' }).click();
    await expect(page.getByRole('button', { name: /7er-Reihe/ })).toBeVisible();
  },

  'Mathe, Rückmeldung': async (page, d) => {
    await startseite(page, d);
    await page.getByRole('link', { name: 'Mathe' }).click();
    await page.getByRole('button', { name: /8er-Reihe/ }).click();
    await page.locator('.uebung-option').first().click();
    await expect(page.getByRole('button', { name: 'Weiter →' })).toBeVisible();
  },

  Tests: async (page, d) => {
    await startseite(page, d);
    await page.getByRole('link', { name: 'Tests' }).click();
    await expect(page.getByRole('button', { name: '➕ Test eintragen' })).toBeVisible();
  },

  'Tests, Formular': async (page, d) => {
    await startseite(page, d);
    await page.getByRole('link', { name: 'Tests' }).click();
    await page.getByRole('button', { name: '➕ Test eintragen' }).click();
    await expect(page.getByLabel('Wann?')).toBeVisible();
  },

  Belohnungen: async (page, d) => {
    await startseite(page, d);
    await page.getByRole('link', { name: 'Belohnungen' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Belohnungen' })).toBeVisible();
  },

  Erfolge: async (page, d) => {
    await startseite(page, d);
    await setzePunkte(page, 320);
    await page.getByRole('link', { name: 'Erfolge' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Meine Erfolge' })).toBeVisible();
  },

  Einstellungen: async (page, d) => {
    await startseite(page, d);
    await page.getByRole('link', { name: 'Einstellungen' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Einstellungen' })).toBeVisible();
  },

  'Eltern-Bereich': elternBereich,

  Wochenübersicht: async (page, d) => {
    await elternBereich(page, d);
    await page.getByRole('button', { name: /Wochenübersicht/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Wochenübersicht' })).toBeVisible();
  },

  'Lerninhalte, Liste': async (page, d) => {
    await lerninhalte(page, d);
  },

  'Lerninhalte, Lektion': async (page, d) => {
    const dialog = await lerninhalte(page, d);
    await dialog.getByText('Unit 5 – Irregular verbs').click();
    await expect(dialog.getByRole('button', { name: '← Alle Lektionen' })).toBeVisible();
  },

  'Lerninhalte, Verb-Lektion': async (page, d) => {
    const dialog = await lerninhalte(page, d);
    await dialog.getByText('Unregelmäßige Verben').click();
    await expect(dialog.getByLabel('2. Form 2')).toHaveValue('was, were');
  },

  'Vokabeln, Verben': async (page, d) => {
    await startseite(page, d);
    await legeLektionAn(page);
    await page.reload();
    await page.getByRole('link', { name: 'Vokabeln' }).click();
    await page.getByRole('button', { name: /Unregelmäßige Verben/ }).click();
    await page.locator('.uebung-option').first().click();
    await expect(page.getByText(/Sag es laut/)).toContainText('–');
  },
};

// TODO: Echte Layout-Fehler der App, die diese Tests gefunden haben (Stand 0.12.0). Passende
// Meldungen lassen den Test nicht scheitern, stehen aber als Anmerkung im Bericht; alle anderen
// Probleme auf derselben Ansicht schlagen weiter an. Nach dem Beheben hier austragen.
// Bewusst kein test.fail(): Kleine Überstände (2–15 px, Emoji-Breiten) könnten unter Linux im CI
// anders ausfallen, und ein „unerwartet bestandener“ Test würde dort scheitern.
// Bekannte, noch nicht behobene Layout-Fehler je Ansicht (Muster der Meldung); leer = alles sauber.
// Neue Einträge nur vorübergehend und mit Begründung.
const BEKANNTE_FEHLER: Record<string, RegExp[]> = {};

for (const darstellung of ['standard', 'maximal'] as const) {
  test.describe(`Layout (${darstellung})`, () => {
    for (const [ansicht, oeffne] of Object.entries(ANSICHTEN)) {
      const wo = `${ansicht} (${darstellung})`;
      test(ansicht, async ({ page }) => {
        await oeffne(page, darstellung);
        const bekannt = BEKANNTE_FEHLER[wo] ?? [];
        const probleme = await pruefeLayout(page);
        for (const p of probleme.filter((p) => bekannt.some((m) => m.test(p)))) {
          test.info().annotations.push({ type: 'bekannter Layout-Fehler (TODO)', description: p });
        }
        const neu = probleme.filter((p) => !bekannt.some((m) => m.test(p)));
        expect(neu, `Layout-Probleme auf ${wo}:\n${neu.join('\n')}`).toEqual([]);
      });
    }
  });
}

// Beweist, dass die Prüfung den alten Fehler findet: Ein doppelt vergebener Klassenname gab dem
// Level-Balken feste Höhe und overflow hidden, und der Text „Noch … Punkte“ wurde abgeschnitten.
test('Layout-Prüfung erkennt den abgeschnittenen Level-Text', async ({ page }) => {
  await startseite(page, 'standard');
  expect(await pruefeLayout(page)).toEqual([]);

  await page.addStyleTag({
    content: '.fortschritt-balken{display:flex;height:.8rem;overflow:hidden}',
  });
  const probleme = await pruefeLayout(page);
  expect(probleme.join('\n')).toMatch(/Text „Noch.*abgeschnitten/);
});

test('Layout-Prüfung erkennt seitliches Scrollen, Überdeckung und zu kleine Knöpfe', async ({
  page,
}) => {
  await startseite(page, 'standard');
  await page.addStyleTag({
    content: `.fortschritt-titel{width:150vw}
      .fortschritt-kopf button{position:relative;top:3rem}
      .kachel a{min-height:0;padding:0;height:30px}`,
  });
  const probleme = (await pruefeLayout(page)).join('\n');
  expect(probleme).toMatch(/Seite scrollt seitlich/);
  expect(probleme).toMatch(/überdecken sich/);
  expect(probleme).toMatch(/zu klein zum Tippen/);
});
