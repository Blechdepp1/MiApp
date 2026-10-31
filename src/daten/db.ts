import Dexie, { type EntityTable } from 'dexie';
import type { Einstellungen } from '../basis/einstellungen.ts';

// Lokale Datenbank auf dem Gerät (IndexedDB)
type EinstellungenZeile = { id: 'geraet' } & Partial<Einstellungen>;
// Gerätegebundene Werte (z. B. Dropbox-Tokens), werden nie synchronisiert
type SchluesselZeile = { id: string; wert: unknown };

class MiAppDb extends Dexie {
  einstellungen!: EntityTable<EinstellungenZeile, 'id'>;
  schluessel!: EntityTable<SchluesselZeile, 'id'>;

  constructor() {
    super('miapp');
    this.version(1).stores({
      einstellungen: 'id',
    });
    this.version(2).stores({
      schluessel: 'id',
    });
  }
}

export const db = new MiAppDb();
