import { INHALTE, type InhaltName } from '../belohnung/inhalte.ts';
import { gesamtPunkte, level, rang } from '../belohnung/logik.ts';
import { LEVEL_START, type Levelstufe } from '../belohnung/werte.ts';
import { db } from '../daten/db.ts';
import { dexieWert } from '../daten/schluesselWert.ts';
import type { LernEreignis } from '../daten/ereignisse.ts';
import type { InhaltEintrag } from '../daten/inhalte.ts';
import type { Lektion } from '../lektionen/lektion.ts';
import { ausJsonl, EREIGNIS_ORDNER } from '../sync/abgleich.ts';
import type { Dropbox } from '../sync/dropbox.ts';
import { istZuNeu } from '../sync/format.ts';
import { INHALT_ORDNER, liesInhalt } from '../sync/inhalteAbgleich.ts';
import { LEKTION_ORDNER, liesLektion } from '../sync/lektionenAbgleich.ts';

// Testkanal: Lektionen, Belohnungen, Level und Punkte aus Milenas App übernehmen – aus dem
// Dropbox-Ordner der Live-App (Apps/MiApp-Lernen) oder, ohne Dropbox, aus der Datenbank der Live-App
// auf demselben Gerät. Beides wird nur gelesen. Geschrieben wird nur in den Testkanal;
// Schlüssel, PIN, Dropbox-Zugang und KI-Schlüssel werden nicht kopiert.

export type LiveDaten = {
  // Woher die Daten stammen, für die Rückfrage
  quelle: string;
  lektionen: Lektion[];
  inhalte: InhaltEintrag[];
  ereignisse: LernEreignis[];
  gesehenesLevel?: number;
};

// Nur lesende Funktionen: Der Testkanal darf im Ordner der Live-App nichts schreiben
export type LiveDropbox = Pick<Dropbox, 'verbunden' | 'liste' | 'herunterladen'>;

// null, wenn der Testkanal nicht mit Dropbox verbunden ist
export async function leseLiveDatenAusDropbox(dropbox: LiveDropbox): Promise<LiveDaten | null> {
  if (!(await dropbox.verbunden())) return null;
  const lies = async (pfad: string) => {
    const text = await dropbox.herunterladen(pfad);
    return text === undefined || istZuNeu(text) ? undefined : text;
  };

  const inhalte: InhaltEintrag[] = [];
  for (const datei of await dropbox.liste(INHALT_ORDNER)) {
    const name = datei.name.replace(/\.json$/, '');
    if (!Object.hasOwn(INHALTE, name)) continue;
    const text = await lies(datei.pfad);
    const eintrag = text === undefined ? undefined : liesInhalt(name as InhaltName, text);
    if (eintrag) inhalte.push(eintrag);
  }

  const lektionen: Lektion[] = [];
  for (const datei of await dropbox.liste(LEKTION_ORDNER)) {
    if (!datei.name.endsWith('.json')) continue;
    const text = await lies(datei.pfad);
    const lektion = text === undefined ? undefined : liesLektion(text);
    if (lektion) lektionen.push(lektion);
  }

  const ereignisse: LernEreignis[] = [];
  for (const datei of await dropbox.liste(EREIGNIS_ORDNER)) {
    const text = await lies(datei.pfad);
    if (text !== undefined) ereignisse.push(...ausJsonl(text));
  }

  return { quelle: 'Dropbox-Ordner Apps/MiApp-Lernen', lektionen, inhalte, ereignisse };
}

export const LIVE_DATENBANK = 'miapp';

function anfrage<T>(a: IDBRequest<T>): Promise<T> {
  return new Promise((fertig, fehler) => {
    a.onsuccess = () => fertig(a.result);
    a.onerror = () => fehler(a.error);
  });
}

// null, wenn Milenas App auf diesem Gerät noch nie benutzt wurde
export async function leseLiveDaten(name = LIVE_DATENBANK): Promise<LiveDaten | null> {
  const vorhanden = (await indexedDB.databases()).some((d) => d.name === name);
  if (!vorhanden) return null;
  // Ohne Versionsnummer öffnen: liest den bestehenden Stand, ohne ihn zu verändern
  const live = await anfrage(indexedDB.open(name));
  try {
    const lies = async <T>(tabelle: string): Promise<T[]> =>
      live.objectStoreNames.contains(tabelle)
        ? anfrage(live.transaction(tabelle).objectStore(tabelle).getAll() as IDBRequest<T[]>)
        : [];
    return {
      quelle: 'Milenas App auf diesem Gerät',
      lektionen: await lies<Lektion>('lektionen'),
      inhalte: await lies<InhaltEintrag>('inhalte'),
      ereignisse: await lies<LernEreignis>('ereignisse'),
    };
  } finally {
    live.close();
  }
}

// Lektionen und Inhalte bekommen einen frischen Zeitstempel, damit sie beim Abgleich mit dem
// Dropbox-Ordner des Testkanals gewinnen und ältere Testdaten dort ersetzen. Das erreichte
// Level gilt als schon gesehen, sonst käme gleich eine Level-Feier.
export function fuerVorschau(live: LiveDaten, jetzt: string): LiveDaten {
  const stufen = live.inhalte.find((i) => i.name === 'level')?.daten ?? LEVEL_START;
  return {
    ...live,
    lektionen: live.lektionen.map((l) => ({ ...l, geaendert: jetzt })),
    inhalte: live.inhalte.map((i) => ({ ...i, geaendert: jetzt })),
    gesehenesLevel: rang(level(gesamtPunkte(live.ereignisse), stufen as Levelstufe[])),
  };
}

export function istLeer(live: LiveDaten): boolean {
  return live.lektionen.length + live.inhalte.length + live.ereignisse.length === 0;
}

// Was zuletzt übernommen wurde, damit man im Testkanal sieht, auf welchem Stand er ist
export type KopieStand = {
  // Zeitpunkt der Übernahme
  zeit: string;
  quelle: string;
  lektionen: number;
  runden: number;
  // Letzte Runde in Milenas App zum Zeitpunkt der Übernahme
  letzteRunde?: string;
};

export const standardKopieStand = dexieWert<KopieStand>('live-kopie');

export function kopieStand(live: LiveDaten, jetzt: string): KopieStand {
  const runden = live.ereignisse.filter((e) => e.typ === 'runde-beendet');
  const letzteRunde = runden
    .map((e) => e.zeit)
    .sort()
    .at(-1);
  return {
    zeit: jetzt,
    quelle: live.quelle,
    lektionen: live.lektionen.filter((l) => !l.geloescht).length,
    runden: runden.length,
    ...(letzteRunde && { letzteRunde }),
  };
}

export function zeitText(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function zusammenfassung(live: LiveDaten): string {
  const lektionen = live.lektionen.filter((l) => !l.geloescht).length;
  const runden = live.ereignisse.filter((e) => e.typ === 'runde-beendet').length;
  return `${lektionen} Lektionen, ${live.inhalte.length} Listen (Belohnungen/Level), ${runden} Runden`;
}

// Ersetzt die Lerndaten des Testkanals durch die Kopie und merkt sich den Stand
export async function schreibeInVorschau(daten: LiveDaten, stand: KopieStand): Promise<void> {
  await db.transaction('rw', [db.lektionen, db.inhalte, db.ereignisse, db.schluessel], async () => {
    await Promise.all([db.lektionen.clear(), db.inhalte.clear(), db.ereignisse.clear()]);
    await db.lektionen.bulkPut(daten.lektionen);
    await db.inhalte.bulkPut(daten.inhalte);
    await db.ereignisse.bulkPut(daten.ereignisse);
    if (daten.gesehenesLevel !== undefined) {
      await db.schluessel.put({ id: 'gesehenes-level', wert: daten.gesehenesLevel });
    }
    await db.schluessel.put({ id: 'live-kopie', wert: stand });
    // Lektionen und Inhalte gleichen sich neu mit dem Testkanal-Ordner ab (die Kopie gewinnt).
    // Den Stand der Ereignisse behalten: Sonst kämen alte Testpunkte anderer Testgeräte zurück.
    await db.schluessel.bulkDelete(['inhalte-stand', 'lektionen-stand']);
  });
}
