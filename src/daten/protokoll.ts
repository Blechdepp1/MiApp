import { db } from './db.ts';
import { erstelleEreignis, sortiere, type EreignisDaten, type LernEreignis } from './ereignisse.ts';

export type Protokoll = {
  alle(): Promise<LernEreignis[]>;
  hinzufuegen(daten: EreignisDaten): Promise<LernEreignis>;
  // Ereignisse anderer Geräte übernehmen; bereits bekannte (gleiche id) werden übersprungen
  importiere(ereignisse: readonly LernEreignis[]): Promise<number>;
  geraetId(): Promise<string>;
  beobachte(zuhoerer: () => void): () => void;
};

type Ablage = {
  laden: () => Promise<LernEreignis[]>;
  speichern: (e: LernEreignis) => Promise<void>;
  // Speichert nur unbekannte Ereignisse und gibt deren Anzahl zurück
  neueSpeichern: (liste: readonly LernEreignis[]) => Promise<number>;
  geraetId: () => Promise<string>;
};

function mitZuhoerern(ablage: Ablage): Protokoll {
  const zuhoerer = new Set<() => void>();
  const melden = () => zuhoerer.forEach((z) => z());
  return {
    alle: async () => sortiere(await ablage.laden()),
    async hinzufuegen(daten) {
      const ereignis = erstelleEreignis(daten, await ablage.geraetId());
      await ablage.speichern(ereignis);
      melden();
      return ereignis;
    },
    async importiere(liste) {
      const neu = await ablage.neueSpeichern(liste);
      if (neu > 0) melden();
      return neu;
    },
    geraetId: ablage.geraetId,
    beobachte(z) {
      zuhoerer.add(z);
      return () => zuhoerer.delete(z);
    },
  };
}

// Zufällige Geräte-ID, einmal erzeugt und lokal gemerkt (Name der eigenen Datei beim Abgleich)
async function dexieGeraetId(): Promise<string> {
  return db.transaction('rw', db.schluessel, async () => {
    const vorhanden = await db.schluessel.get('geraet-id');
    if (typeof vorhanden?.wert === 'string') return vorhanden.wert;
    const neu = crypto.randomUUID();
    await db.schluessel.put({ id: 'geraet-id', wert: neu });
    return neu;
  });
}

export const dexieProtokoll: Protokoll = mitZuhoerern({
  laden: () => db.ereignisse.toArray(),
  speichern: async (e) => {
    await db.ereignisse.add(e);
  },
  neueSpeichern: (liste) =>
    db.transaction('rw', db.ereignisse, async () => {
      const vorhanden = await db.ereignisse.bulkGet(liste.map((e) => e.id));
      const neu = liste.filter((_, i) => vorhanden[i] === undefined);
      await db.ereignisse.bulkAdd(neu);
      return neu.length;
    }),
  geraetId: dexieGeraetId,
});

export function protokollImArbeitsspeicher(
  start: LernEreignis[] = [],
  geraetId = 'test-geraet',
): Protokoll {
  const liste = [...start];
  return mitZuhoerern({
    laden: async () => liste,
    speichern: async (e) => {
      liste.push(e);
    },
    neueSpeichern: async (neue) => {
      const ids = new Set(liste.map((e) => e.id));
      const unbekannt = neue.filter((e) => !ids.has(e.id) && ids.add(e.id));
      liste.push(...unbekannt);
      return unbekannt.length;
    },
    geraetId: async () => geraetId,
  });
}
