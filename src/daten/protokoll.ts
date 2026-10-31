import { db } from './db.ts';
import { erstelleEreignis, sortiere, type EreignisDaten, type LernEreignis } from './ereignisse.ts';

export type Protokoll = {
  alle(): Promise<LernEreignis[]>;
  hinzufuegen(daten: EreignisDaten): Promise<LernEreignis>;
  beobachte(zuhoerer: () => void): () => void;
};

function mitZuhoerern(
  laden: () => Promise<LernEreignis[]>,
  speichern: (e: LernEreignis) => Promise<void>,
  geraetId: () => Promise<string>,
): Protokoll {
  const zuhoerer = new Set<() => void>();
  return {
    alle: async () => sortiere(await laden()),
    async hinzufuegen(daten) {
      const ereignis = erstelleEreignis(daten, await geraetId());
      await speichern(ereignis);
      zuhoerer.forEach((z) => z());
      return ereignis;
    },
    beobachte(z) {
      zuhoerer.add(z);
      return () => zuhoerer.delete(z);
    },
  };
}

// Zufällige Geräte-ID, einmal erzeugt und lokal gemerkt (für den späteren Abgleich)
async function dexieGeraetId(): Promise<string> {
  return db.transaction('rw', db.schluessel, async () => {
    const vorhanden = await db.schluessel.get('geraet-id');
    if (typeof vorhanden?.wert === 'string') return vorhanden.wert;
    const neu = crypto.randomUUID();
    await db.schluessel.put({ id: 'geraet-id', wert: neu });
    return neu;
  });
}

export const dexieProtokoll: Protokoll = mitZuhoerern(
  () => db.ereignisse.toArray(),
  async (e) => {
    await db.ereignisse.add(e);
  },
  dexieGeraetId,
);

export function protokollImArbeitsspeicher(start: LernEreignis[] = []): Protokoll {
  const liste = [...start];
  return mitZuhoerern(
    async () => liste,
    async (e) => {
      liste.push(e);
    },
    async () => 'test-geraet',
  );
}
