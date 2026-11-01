import {
  alsVokabelliste,
  hatVorrang,
  istVokabelLektion,
  type Lektion,
} from '../lektionen/lektion.ts';
import { BEISPIELLISTE } from './beispielliste.ts';
import type { Vokabelliste } from './typen.ts';

// Geübt werden alle Englisch-Lektionen; die Beispielliste nur, solange es noch keine gibt.
// Vorrang haben Lektionen, deren Klassenarbeit bald ansteht.
export function vokabelQuellen(
  lektionen: readonly Lektion[],
  heute: string,
): { listen: Vokabelliste[]; vorrang: Set<string> } {
  const englisch = lektionen.filter(istVokabelLektion);
  if (englisch.length === 0) return { listen: [BEISPIELLISTE], vorrang: new Set() };
  return {
    listen: englisch.map(alsVokabelliste),
    vorrang: new Set(englisch.filter((l) => hatVorrang(l, heute)).map((l) => l.id)),
  };
}
