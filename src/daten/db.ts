import Dexie, { type EntityTable } from 'dexie';
import type { Einstellungen } from '../basis/einstellungen.ts';

// Lokale Datenbank auf dem Gerät (IndexedDB)
type EinstellungenZeile = { id: 'geraet' } & Partial<Einstellungen>;

class MiAppDb extends Dexie {
  einstellungen!: EntityTable<EinstellungenZeile, 'id'>;

  constructor() {
    super('miapp');
    this.version(1).stores({
      einstellungen: 'id',
    });
  }
}

export const db = new MiAppDb();
