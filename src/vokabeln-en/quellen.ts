import {
  alsVokabelliste,
  hatVorrang,
  istVokabelLektion,
  sortiereLektionen,
  statusVon,
  type Lektion,
} from '../lektionen/lektion.ts';
import { BEISPIELLISTE } from './beispielliste.ts';
import { wortStand, type WortStand } from './leitner.ts';
import type { Vokabelliste } from './typen.ts';

// Geübt werden aktive Englisch-Lektionen; pausierte noch gar nicht, archivierte nur noch die
// Wörter, die sie schon gelernt hat (Wiederholung, keine neuen). Die Beispielliste gibt es nur,
// solange noch keine Englisch-Lektion existiert. Vorrang haben Lektionen mit naher Klassenarbeit.
export function vokabelQuellen(
  lektionen: readonly Lektion[],
  heute: string,
  staende: ReadonlyMap<string, WortStand> = new Map(),
  // Lektionen eines bald anstehenden Tests: immer ganz dabei, egal welcher Status
  immerDabei: ReadonlySet<string> = new Set(),
): { listen: Vokabelliste[]; vorrang: Set<string> } {
  const englisch = sortiereLektionen(lektionen.filter(istVokabelLektion));
  if (englisch.length === 0) return { listen: [BEISPIELLISTE], vorrang: new Set() };
  const listen: Vokabelliste[] = [];
  for (const l of englisch) {
    const status = immerDabei.has(l.id) ? 'aktiv' : statusVon(l);
    if (status === 'pausiert') continue;
    const liste = alsVokabelliste(l);
    if (status === 'archiviert') {
      const geuebt = liste.woerter.filter((w) => wortStand(staende, l.id, w.id).fach > 0);
      if (geuebt.length > 0) listen.push({ ...liste, woerter: geuebt });
      continue;
    }
    listen.push(liste);
  }
  return {
    listen,
    vorrang: new Set(
      englisch.filter((l) => statusVon(l) !== 'pausiert' && hatVorrang(l, heute)).map((l) => l.id),
    ),
  };
}
