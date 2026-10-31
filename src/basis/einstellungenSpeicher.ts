import { db } from '../daten/db.ts';
import type { EinstellungsSpeicher } from './einstellungen.ts';

// Die Zeile enthält zusätzlich "id"; bereinige() übernimmt nur bekannte Felder
export const dexieSpeicher: EinstellungsSpeicher = {
  laden: () => db.einstellungen.get('geraet'),
  async speichern(einstellungen) {
    await db.einstellungen.put({ id: 'geraet', ...einstellungen });
  },
};
