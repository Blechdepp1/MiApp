import { schwierigeWoerter } from '../eltern/statistik.ts';
import type { LernEreignis } from '../daten/ereignisse.ts';
import { lektionsRundeAuswaehlen, wortStand, type RundenWort, type WortStand } from './leitner.ts';
import type { Zufall } from './runde.ts';
import type { Vokabelliste } from './typen.ts';

// Was Milena vor der Runde auswählt: den Mix der App, eine bestimmte Lektion oder die Wörter,
// bei denen sie zuletzt oft danebenlag
export type Modus = { art: 'mix' } | { art: 'lektion'; listeId: string } | { art: 'schwierig' };

// Schwierige Wörter: die mit den meisten Fehlern der letzten 14 Tage
export function schwierigeRunde(
  listen: readonly Vokabelliste[],
  ereignisse: readonly LernEreignis[],
  staende: Map<string, WortStand>,
  heute: string,
): RundenWort[] {
  return schwierigeWoerter(listen, ereignisse, heute).map(({ liste, wort }) => ({
    liste,
    wort,
    stand: wortStand(staende, liste.id, wort.id),
  }));
}

// Wörter für eine selbst gewählte Runde; undefined beim Mix (dann wählt die Runde selbst)
export function woerterFuer(
  modus: Modus,
  listen: readonly Vokabelliste[],
  ereignisse: readonly LernEreignis[],
  staende: Map<string, WortStand>,
  heute: string,
  zufall: Zufall = Math.random,
): RundenWort[] | undefined {
  if (modus.art === 'schwierig') return schwierigeRunde(listen, ereignisse, staende, heute);
  if (modus.art === 'lektion') {
    const liste = listen.find((l) => l.id === modus.listeId);
    return liste ? lektionsRundeAuswaehlen(liste, staende, heute, zufall) : [];
  }
  return undefined;
}
