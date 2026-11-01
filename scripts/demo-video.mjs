// Nimmt ein Demo-Video der Live-App in Handy-Größe auf: node scripts/demo-video.mjs <ausgabeordner>
// Läuft in einem frischen Browser – berührt weder echte Geräte noch Dropbox.
import { chromium } from '@playwright/test';

const ADRESSE = 'https://blechdepp1.github.io/MiApp/';
const ordner = process.argv[2] ?? 'demo';
const HANDY = { width: 412, height: 915 };

// Erste fünf Wörter der Beispielliste
const DEUTSCH = {
  house: 'Haus',
  school: 'Schule',
  friend: 'Freund, Freundin',
  family: 'Familie',
  brother: 'Bruder',
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
const pause = (ms) => seite.waitForTimeout(ms);

// Erklärtext oben einblenden (bleibt bei Seitenwechseln innerhalb der App stehen)
async function untertitel(text, dauer = 2500) {
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
    el.textContent = t;
    el.style.display = 'block';
  }, text);
  await pause(dauer);
  // Wieder ausblenden, damit der Text nicht über der nächsten Ansicht stehen bleibt
  await seite.evaluate(() => {
    const el = document.getElementById('demo-untertitel');
    if (el) el.style.display = 'none';
  });
}

async function tippe(locator, warten = 700) {
  await locator.scrollIntoViewIfNeeded();
  // Nach Schriftgrößen-Wechseln verschiebt sich das Layout noch kurz; dann direkt auslösen
  await locator.click({ timeout: 3000 }).catch(() => locator.dispatchEvent('click'));
  await pause(warten);
}

async function pin(ziffern = '1234') {
  for (const z of ziffern) await tippe(seite.getByRole('button', { name: z, exact: true }), 250);
}

// 1. Start und Einrichtung
await seite.goto(ADRESSE);
await pause(1500);
await untertitel('MiApp – unsere Lern-App für Englisch-Vokabeln, LRS-gerecht 📚', 3000);
await untertitel('Beim ersten Start: Gerät einrichten (Kind oder Eltern + Eltern-PIN)', 2500);
await tippe(seite.getByRole('button', { name: /Wir Eltern/ }));
await pin();
await pin();
await pause(1000);

// Demo-Punkte, damit gleich ein Level-Aufstieg passiert (nur in diesem Aufnahme-Browser)
await seite.evaluate(
  () =>
    new Promise((fertig) => {
      const anfrage = indexedDB.open('miapp');
      anfrage.onsuccess = () => {
        const db = anfrage.result;
        const tx = db.transaction(['ereignisse', 'schluessel'], 'readwrite');
        tx.objectStore('ereignisse').put({
          id: 'demo-start',
          geraet: 'demo',
          zeit: new Date(Date.now() - 3 * 86_400_000).toISOString(),
          typ: 'runde-beendet',
          richtig: 60,
          mitHilfe: 0,
          verbessert: 0,
        });
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

// 2. Startseite
await untertitel('Startseite: Level, Punkte und Tagesziel – alles mit 🔊 vorlesbar', 3500);

// 3. Einstellungen
await tippe(seite.getByRole('link', { name: 'Einstellungen' }));
await untertitel(
  'Einstellungen: Schriftgröße, Abstände, Hintergrund, Schrift, Vorlese-Tempo',
  2000,
);
await tippe(seite.getByRole('radio', { name: 'Groß', exact: true }), 900);
await tippe(seite.getByRole('radio', { name: 'Hellblau' }), 1200);
await tippe(seite.getByRole('radio', { name: 'OpenDyslexic' }), 1500);
await tippe(seite.getByRole('radio', { name: 'Standard', exact: true }), 400);
await tippe(seite.getByRole('radio', { name: 'Creme', exact: true }), 400);
await tippe(
  seite.getByRole('radiogroup', { name: 'Schriftgröße' }).getByRole('radio', { name: 'Normal' }),
  600,
);
await tippe(seite.getByRole('link', { name: /Zurück/ }), 800);

// 4. Vokabelrunde
await tippe(seite.getByRole('link', { name: 'Vokabeln' }), 1000);
await untertitel(
  'Vokabeln: Das englische Wort wird vorgelesen – richtige Übersetzung antippen',
  3000,
);

let schritt = 0;
while (!(await seite.getByRole('button', { name: 'Noch eine Runde' }).isVisible())) {
  const englisch = (await seite.locator('.uebung-frage > span').last().textContent()).trim();
  const richtig = DEUTSCH[englisch] ?? Object.values(DEUTSCH).find((d) => d === englisch);
  schritt++;
  if (schritt === 2) {
    // Einmal absichtlich daneben, um die freundliche Rückmeldung zu zeigen
    const falsch = seite.locator('.uebung-option').filter({ hasNotText: richtig }).first();
    await tippe(falsch, 600);
    await untertitel(
      'Daneben? Kein Rot, keine Strafe: Die Lösung wird gezeigt und vorgelesen',
      3000,
    );
    await untertitel('… und das Wort kommt am Ende der Runde noch einmal', 2200);
  } else {
    await tippe(seite.locator('.uebung-option', { hasText: richtig }), 1100);
  }
  await tippe(seite.getByRole('button', { name: 'Weiter →' }), 700);
}

// 5. Zusammenfassung und Level-Feier
await untertitel('Geschafft! Punkte für die Runde, Fortschritt beim Tagesziel', 2500);
const feier = seite.getByRole('dialog', { name: 'Neues Level!' });
if (await feier.isVisible()) {
  await untertitel('Level-Aufstieg: kleine Feier mit Fanfare 🎉', 3500);
  await tippe(seite.getByRole('button', { name: /Juhu/ }), 800);
}
await tippe(seite.getByRole('link', { name: 'Zur Startseite' }), 1200);
await untertitel('Zurück auf der Startseite: neues Level, neue Punkte', 2500);

// 6. Eltern-Bereich
await untertitel('Oben rechts 🔒: der Eltern-Bereich', 1800);
await tippe(seite.getByRole('link', { name: 'Eltern-Bereich' }), 300);
await untertitel('Er öffnet sich nur mit der Eltern-PIN', 1800);
await pin();
await pause(800);
await untertitel('Dropbox: gleicht Punkte und Einstellungen zwischen unseren Handys ab', 3000);
await seite.getByRole('heading', { name: 'Belohnungen' }).scrollIntoViewIfNeeded();
await pause(500);
await untertitel('Belohnungen festlegen – mit ungefährer Lernzeit pro Belohnung', 4000);
await seite.getByRole('heading', { name: 'Level' }).scrollIntoViewIfNeeded();
await pause(500);
await untertitel('Level-Titel und Punkte-Schwellen selbst anpassen', 3000);
await untertitel('Als Nächstes: Belohnungen einlösen und Vokabeln per Foto importieren 📸', 3500);

const video = seite.video();
await kontext.close();
console.log(await video.path());
await browser.close();
