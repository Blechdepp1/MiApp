import {
  alsVokabelliste,
  hatVorrang,
  istVokabelLektion,
  sortiereLektionen,
  statusVon,
  VORRANG_TAGE,
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

export type Endspurt = { lektionId: string; titel: string; tage: number; woerter: number };

// Lektionen, deren Klassenarbeit oder eingetragener Test in den nächsten Tagen ansteht,
// mit Tagen bis zum nächsten Termin (für den Hinweis am Rundenstart)
export function endspurt(
  lektionen: readonly Lektion[],
  testTermine: readonly { lektionId: string; datum: string }[],
  heute: string,
  tage = VORRANG_TAGE,
): Endspurt[] {
  const ergebnis: Endspurt[] = [];
  for (const l of sortiereLektionen(lektionen.filter(istVokabelLektion))) {
    const termine = [
      l.klassenarbeit,
      ...testTermine.filter((t) => t.lektionId === l.id).map((t) => t.datum),
    ]
      .filter((d): d is string => !!d)
      .map((d) => Math.round((Date.parse(d) - Date.parse(heute)) / 86_400_000))
      .filter((n) => n >= 0 && n <= tage);
    if (termine.length === 0) continue;
    ergebnis.push({
      lektionId: l.id,
      titel: l.titel,
      tage: Math.min(...termine),
      woerter: alsVokabelliste(l).woerter.length,
    });
  }
  return ergebnis;
}

export function endspurtText(e: Endspurt): string {
  const wann =
    e.tage === 0
      ? 'Heute ist die Arbeit.'
      : e.tage === 1
        ? 'Morgen ist die Arbeit.'
        : `Noch ${e.tage} Tage bis zur Arbeit.`;
  return `${wann} ${e.woerter} Wörter aus ${e.titel} frischen wir auf.`;
}
