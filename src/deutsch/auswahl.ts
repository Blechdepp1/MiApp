import type { Fortschritt } from '../eltern/statistik.ts';
import { lernstand } from '../eltern/statistik.ts';
import {
  gemischteRunde,
  wortStand,
  type LernListe,
  type RundenWort,
  type WortStand,
} from '../vokabeln-en/leitner.ts';
import type { Zufall } from '../vokabeln-en/runde.ts';
import { loesungText } from './bewertung.ts';
import type { Aufgabe, Thema } from './typen.ts';

export type Wahl = { art: 'mix' } | { art: 'thema'; id: string };

// Für alle Fächer mit Themen (Deutsch, Mathe)
export function fortschrittThema(
  thema: LernListe,
  staende: ReadonlyMap<string, WortStand>,
): Fortschritt {
  const f: Fortschritt = { neu: 0, lernt: 0, sicher: 0, gesamt: thema.woerter.length };
  for (const a of thema.woerter) f[lernstand(wortStand(staende, thema.id, a.id))]++;
  return f;
}

// Mix oder ein Thema, Aufgaben gemischt (siehe gemischteRunde)
export function deutschAuswahl(
  wahl: Wahl,
  themen: readonly Thema[],
  staende: Map<string, WortStand>,
  heute: string,
  zufall: Zufall = Math.random,
): RundenWort<Thema>[] {
  return gemischteRunde(wahl.art === 'thema' ? wahl.id : null, themen, staende, heute, zufall);
}

export function loesungVon(a: Aufgabe): string {
  if (a.art === 'waehlen') return a.richtig.join(' oder ');
  if (a.art === 'schreiben') return a.loesungen[0]!;
  return loesungText(a);
}
