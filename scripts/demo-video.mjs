// Nimmt ein Demo-Video der Live-App in Handy-Größe auf, passend zu den Sprecher-Aufnahmen.
// Aufruf: node scripts/demo-video.mjs <ausgabeordner> <sprecherordner>
// Läuft in einem frischen Browser – berührt weder echte Geräte noch Dropbox.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ADRESSE = 'https://blechdepp1.github.io/MiApp/';
const [ordner = 'demo', sprecher = 'demo/sprecher'] = process.argv.slice(2);
const TEXTE = JSON.parse(readFileSync(new URL('./demo-text.json', import.meta.url), 'utf8'));
const DAUERN = JSON.parse(readFileSync(join(sprecher, 'dauern.json'), 'utf8'));
const HANDY = { width: 412, height: 915 };

// Wörter der Beispielliste, die in der Runde vorkommen (Englisch ↔ Deutsch)
const WOERTER = {
  friend: 'Freund, Freundin',
  house: 'Haus',
  school: 'Schule',
  family: 'Familie',
  brother: 'Bruder',
  sister: 'Schwester',
  dog: 'Hund',
  cat: 'Katze',
};

const browser = await chromium.launch();
const kontext = await browser.newContext({
  viewport: HANDY,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  recordVideo: { dir: ordner, size: { width: 618, height: 1372 } },
});
const seite = await kontext.newPage();
const t0 = Date.now();
const jetzt = () => Date.now() - t0;
const pause = (ms) => seite.waitForTimeout(ms);
const zeiten = [];

async function untertitel(text) {
  await seite.evaluate((t) => {
    let el = document.getElementById('demo-untertitel');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-untertitel';
      Object.assign(el.style, {
        position: 'fixed',
        left: '8px',
        right: '8px',
        bottom: '10px',
        zIndex: '9999',
        padding: '10px 12px',
        borderRadius: '12px',
        background: 'rgba(20, 20, 20, 0.85)',
        color: '#fff',
        font: '600 17px/1.35 system-ui, sans-serif',
        textAlign: 'center',
        pointerEvents: 'none',
      });
      document.body.appendChild(el);
    }
    el.textContent = t ?? '';
    el.style.display = t ? 'block' : 'none';
  }, text);
}

// Ein gesprochener Abschnitt: Text einblenden, Aktionen ausführen, mindestens so lange wie die Stimme
async function abschnitt(id, aktionen = async () => {}) {
  const start = jetzt();
  zeiten.push({ id, start });
  await untertitel(TEXTE[id].zeigen);
  await aktionen();
  const rest = DAUERN[id] - (jetzt() - start);
  if (rest > 0) await pause(rest);
  await pause(500);
  await untertitel(null);
}

async function tippe(locator, warten = 700) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ timeout: 3000 }).catch(() => locator.dispatchEvent('click'));
  await pause(warten);
}

async function pin(ziffern = '1234') {
  for (const z of ziffern) await tippe(seite.getByRole('button', { name: z, exact: true }), 120);
}

async function frage() {
  return (await seite.locator('.uebung-frage > span').last().textContent()).trim();
}

// Beantwortet die aktuelle Auswahl-Frage richtig oder absichtlich falsch
async function waehle(richtig = true, warten = 1500) {
  const gefragt = await frage();
  const englisch = Object.keys(WOERTER).find((en) => en === gefragt || WOERTER[en] === gefragt);
  const loesung = gefragt === englisch ? WOERTER[englisch] : englisch;
  const optionen = seite.locator('.uebung-option');
  const ziel = richtig
    ? optionen.filter({ hasText: new RegExp(`^(✓ )?${loesung}$`) })
    : optionen.filter({ hasNotText: loesung }).first();
  await tippe(ziel, warten);
}

async function weiter(warten = 600) {
  await tippe(seite.getByRole('button', { name: 'Weiter →' }), warten);
}

// --- Vorbereitung (wird später aus dem Video geschnitten) ---
await seite.goto(ADRESSE);
await pause(1200);
await tippe(seite.getByRole('button', { name: /Wir Eltern/ }), 300);
await pin();
await pin();
await pause(800);

// Lernstand für die Demo: 130 Punkte, einige Wörter schon geübt (nur in diesem Aufnahme-Browser)
await seite.evaluate(
  () =>
    new Promise((fertig) => {
      const tag = (n) => new Date(Date.now() - n * 86_400_000).toISOString();
      const antwort = (id, wortId, uebung, n) => ({
        id,
        geraet: 'demo',
        zeit: tag(n),
        typ: 'antwort',
        listeId: 'beispiel-1',
        wortId,
        uebung,
        richtig: true,
      });
      const ereignisse = [
        {
          id: 'd0',
          geraet: 'demo',
          zeit: tag(3),
          typ: 'runde-beendet',
          richtig: 60,
          mitHilfe: 0,
          verbessert: 0,
        },
        antwort('d1', 'house', 'erkennen', 3),
        antwort('d2', 'house', 'waehlen-de-en', 2),
        antwort('d3', 'school', 'erkennen', 3),
        antwort('d4', 'school', 'waehlen-de-en', 2),
        antwort('d5', 'friend', 'erkennen', 2),
      ];
      const anfrage = indexedDB.open('miapp');
      anfrage.onsuccess = () => {
        const db = anfrage.result;
        const tx = db.transaction(['ereignisse', 'schluessel'], 'readwrite');
        for (const e of ereignisse) tx.objectStore('ereignisse').put(e);
        tx.objectStore('schluessel').put({ id: 'gesehenes-level', wert: 1000 });
        tx.oncomplete = () => {
          db.close();
          fertig();
        };
      };
    }),
);
await seite.reload();
await pause(1500);
const schnitt = jetzt();

// --- Demo ---
await abschnitt('start');

await abschnitt('vorlesen', async () => {
  await pause(1500);
  await tippe(seite.locator('.fortschritt .vorlese-knopf button'), 2500);
  await tippe(seite.locator('.kachel .vorlese-knopf button').first(), 1500);
});

await tippe(seite.getByRole('link', { name: 'Einstellungen' }), 500);
await abschnitt('einstellungen', async () => {
  await tippe(seite.getByRole('radio', { name: 'Groß', exact: true }), 1500);
  await tippe(seite.getByRole('radio', { name: 'Weit', exact: true }), 1500);
  await tippe(seite.getByRole('radio', { name: 'Hellblau', exact: true }), 1500);
  await tippe(seite.getByRole('radio', { name: 'OpenDyslexic', exact: true }), 1500);
});
// Ohne Kommentar wieder zurückstellen
for (const [gruppe, wert] of [
  ['Schrift', 'Standard'],
  ['Hintergrund', 'Creme'],
  ['Abstand', 'Normal'],
  ['Schriftgröße', 'Normal'],
]) {
  await tippe(
    seite.getByRole('radiogroup', { name: gruppe }).getByRole('radio', { name: wert }),
    150,
  );
}
await tippe(seite.getByRole('link', { name: /Zurück/ }), 400);
await tippe(seite.getByRole('link', { name: 'Vokabeln' }), 1000);

// Bekanntes Wort (friend): Deutsch sehen, Englisch wählen
await abschnitt('bekannt', async () => {
  await pause(3500);
  await waehle(true, 2500);
});
await weiter();

// Schreiben mit Hilfe (house)
await abschnitt('schreiben', async () => {
  await pause(3500);
  await tippe(seite.getByRole('button', { name: '💡 Hilfe' }), 1500);
  await seite.getByRole('textbox').pressSequentially('house', { delay: 220 });
  await pause(600);
  await tippe(seite.getByRole('button', { name: 'Prüfen' }), 1200);
});
await weiter();

// Kleiner Tippfehler (school → scool)
await abschnitt('fast', async () => {
  await seite.getByRole('textbox').pressSequentially('scool', { delay: 220 });
  await pause(500);
  await tippe(seite.getByRole('button', { name: 'Prüfen' }), 2000);
});
await weiter();

// Neues Wort: hören und Deutsch antippen
await abschnitt('neu', async () => {
  await pause(4500);
  await waehle(true, 2000);
});
await weiter();

// Absichtlich daneben
await abschnitt('falsch', async () => {
  await pause(1500);
  await waehle(false, 1000);
});
await weiter();

// Restliche Wörter zügig
await abschnitt('wiederholen', async () => {
  while (await seite.locator('.uebung-option').count()) {
    await waehle(true, 700);
    await weiter(500);
  }
});

await abschnitt('feier', async () => {
  await pause(3500);
  const juhu = seite.getByRole('button', { name: /Juhu/ });
  if (await juhu.isVisible()) {
    await pause(1500);
    await tippe(juhu, 300);
  }
});

await tippe(seite.getByRole('link', { name: 'Zur Startseite' }), 800);
await abschnitt('tagesziel');

// Eltern-Bereich ohne Kommentar öffnen
await tippe(seite.getByRole('link', { name: 'Eltern-Bereich' }), 300);
await pin();
await pause(500);
await seite
  .getByRole('heading', { name: 'Belohnungen' })
  .evaluate((h) => h.scrollIntoView({ block: 'start' }));
await abschnitt('belohnungen', async () => {
  await pause(5000);
  await seite.mouse.wheel(0, 260);
  await pause(3500);
  await seite.mouse.wheel(0, 260);
});

await tippe(seite.getByRole('link', { name: /Zurück/ }), 500);
await abschnitt('ausblick');

const video = seite.video();
await kontext.close();
const pfad = await video.path();
writeFileSync(
  join(ordner, 'zeiten.json'),
  JSON.stringify({ video: pfad, schnitt, ende: jetzt(), zeiten }, null, 2),
);
console.log(pfad);
await browser.close();
