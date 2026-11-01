import { db } from '../daten/db.ts';
import type { Lektion } from './lektion.ts';

// Alle Lektionen dieses Geräts, inklusive Lösch-Markierungen
export type LektionenSpeicher = {
  alle(): Promise<Lektion[]>;
  lade(id: string): Promise<Lektion | undefined>;
  speichere(lektion: Lektion): Promise<void>;
  beobachte(zuhoerer: () => void): () => void;
};

function mitZuhoerern(
  alle: () => Promise<Lektion[]>,
  lade: (id: string) => Promise<Lektion | undefined>,
  schreibe: (l: Lektion) => Promise<void>,
): LektionenSpeicher {
  const zuhoerer = new Set<() => void>();
  return {
    alle,
    lade,
    async speichere(lektion) {
      await schreibe(lektion);
      zuhoerer.forEach((z) => z());
    },
    beobachte(z) {
      zuhoerer.add(z);
      return () => zuhoerer.delete(z);
    },
  };
}

// async, damit Fehler der Datenbank als abgelehntes Promise ankommen statt direkt geworfen zu werden
export const dexieLektionen: LektionenSpeicher = mitZuhoerern(
  async () => db.lektionen.toArray(),
  async (id) => db.lektionen.get(id),
  async (l) => {
    await db.lektionen.put(l);
  },
);

export function lektionenImArbeitsspeicher(start: Lektion[] = []): LektionenSpeicher {
  const lektionen = new Map(start.map((l) => [l.id, l]));
  return mitZuhoerern(
    async () => [...lektionen.values()],
    async (id) => lektionen.get(id),
    async (l) => {
      lektionen.set(l.id, l);
    },
  );
}
