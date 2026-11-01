import type { InhaltDaten, InhaltName } from '../belohnung/inhalte.ts';
import { db } from './db.ts';

// Inhalte (Belohnungen, Level-Tabelle, später Vokabellisten) legen die Eltern fest.
// Bei Änderungen gewinnt der neueste Stand („geaendert“).
export type InhaltEintrag<N extends InhaltName = InhaltName> = {
  name: N;
  daten: InhaltDaten[N];
  geaendert: string;
};

export type InhalteSpeicher = {
  lade<N extends InhaltName>(name: N): Promise<InhaltEintrag<N> | undefined>;
  alle(): Promise<InhaltEintrag[]>;
  speichere(eintrag: InhaltEintrag): Promise<void>;
  beobachte(zuhoerer: () => void): () => void;
};

function mitZuhoerern(
  lade: (name: InhaltName) => Promise<InhaltEintrag | undefined>,
  alle: () => Promise<InhaltEintrag[]>,
  schreibe: (e: InhaltEintrag) => Promise<void>,
): InhalteSpeicher {
  const zuhoerer = new Set<() => void>();
  return {
    lade: lade as InhalteSpeicher['lade'],
    alle,
    async speichere(eintrag) {
      await schreibe(eintrag);
      zuhoerer.forEach((z) => z());
    },
    beobachte(z) {
      zuhoerer.add(z);
      return () => zuhoerer.delete(z);
    },
  };
}

export const dexieInhalte: InhalteSpeicher = mitZuhoerern(
  (name) => db.inhalte.get(name),
  () => db.inhalte.toArray(),
  async (e) => {
    await db.inhalte.put(e);
  },
);

export function inhalteImArbeitsspeicher(start: InhaltEintrag[] = []): InhalteSpeicher {
  const eintraege = new Map(start.map((e) => [e.name, e]));
  return mitZuhoerern(
    async (name) => eintraege.get(name),
    async () => [...eintraege.values()],
    async (e) => {
      eintraege.set(e.name, e);
    },
  );
}
