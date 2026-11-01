import type { Lektion } from '../lektionen/lektion.ts';
import { db } from '../daten/db.ts';
import type { LernEreignis } from '../daten/ereignisse.ts';
import type { InhaltEintrag } from '../daten/inhalte.ts';

// Testkanal: Lektionen, Belohnungen, Level und Punkte aus Milenas App auf demselben Gerät
// übernehmen. Beide liegen unter derselben Adresse, der Testkanal darf die Datenbank der
// Live-App also lesen. Geschrieben wird nur in die eigene; Schlüssel, PIN, Dropbox-Zugang
// und KI-Schlüssel werden nicht kopiert.

export type LiveDaten = {
  lektionen: Lektion[];
  inhalte: InhaltEintrag[];
  ereignisse: LernEreignis[];
  gesehenesLevel?: number;
};

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
    const schluessel = await lies<{ id: string; wert: unknown }>('schluessel');
    const gesehen = schluessel.find((s) => s.id === 'gesehenes-level')?.wert;
    return {
      lektionen: await lies<Lektion>('lektionen'),
      inhalte: await lies<InhaltEintrag>('inhalte'),
      ereignisse: await lies<LernEreignis>('ereignisse'),
      ...(typeof gesehen === 'number' && { gesehenesLevel: gesehen }),
    };
  } finally {
    live.close();
  }
}

// Lektionen und Inhalte bekommen einen frischen Zeitstempel, damit sie beim Abgleich mit dem
// Dropbox-Ordner des Testkanals gewinnen und ältere Testdaten dort ersetzen
export function fuerVorschau(live: LiveDaten, jetzt: string): LiveDaten {
  return {
    ...live,
    lektionen: live.lektionen.map((l) => ({ ...l, geaendert: jetzt })),
    inhalte: live.inhalte.map((i) => ({ ...i, geaendert: jetzt })),
  };
}

export function zusammenfassung(live: LiveDaten): string {
  const lektionen = live.lektionen.filter((l) => !l.geloescht).length;
  const runden = live.ereignisse.filter((e) => e.typ === 'runde-beendet').length;
  return `${lektionen} Lektionen, ${live.inhalte.length} Listen (Belohnungen/Level), ${runden} Runden`;
}

// Ersetzt die Lerndaten des Testkanals durch die Kopie
export async function schreibeInVorschau(daten: LiveDaten): Promise<void> {
  await db.transaction('rw', [db.lektionen, db.inhalte, db.ereignisse, db.schluessel], async () => {
    await Promise.all([db.lektionen.clear(), db.inhalte.clear(), db.ereignisse.clear()]);
    await db.lektionen.bulkPut(daten.lektionen);
    await db.inhalte.bulkPut(daten.inhalte);
    await db.ereignisse.bulkPut(daten.ereignisse);
    if (daten.gesehenesLevel !== undefined) {
      await db.schluessel.put({ id: 'gesehenes-level', wert: daten.gesehenesLevel });
    }
    // Abgleich mit dem Dropbox-Ordner des Testkanals beginnt von vorn
    await db.schluessel.bulkDelete(['abgleich-stand', 'inhalte-stand', 'lektionen-stand']);
  });
}
