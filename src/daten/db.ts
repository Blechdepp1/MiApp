import { KANAL } from '../basis/kanal.ts';
import Dexie, { type EntityTable } from 'dexie';
import type { Einstellungen } from '../basis/einstellungen.ts';
import type { LernEreignis } from './ereignisse.ts';
import type { Lektion } from '../lektionen/lektion.ts';
import type { InhaltEintrag } from './inhalte.ts';

// Lokale Datenbank auf dem Gerät (IndexedDB)
type EinstellungenZeile = { id: 'geraet' } & Partial<Einstellungen>;
// Gerätegebundene Werte (z. B. Dropbox-Tokens), werden nie synchronisiert
type SchluesselZeile = { id: string; wert: unknown };

class MiAppDb extends Dexie {
  einstellungen!: EntityTable<EinstellungenZeile, 'id'>;
  schluessel!: EntityTable<SchluesselZeile, 'id'>;
  ereignisse!: EntityTable<LernEreignis, 'id'>;
  inhalte!: EntityTable<InhaltEintrag, 'name'>;
  lektionen!: EntityTable<Lektion, 'id'>;

  constructor() {
    super(KANAL.datenbank);
    this.version(1).stores({
      einstellungen: 'id',
    });
    this.version(2).stores({
      schluessel: 'id',
    });
    this.version(3).stores({
      ereignisse: 'id, zeit, typ',
    });
    this.version(4).stores({
      inhalte: 'name',
    });
    this.version(5).stores({
      lektionen: 'id',
    });
  }
}

export const db = new MiAppDb();
