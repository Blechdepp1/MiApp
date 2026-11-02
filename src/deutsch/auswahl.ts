import type { Fortschritt } from '../eltern/statistik.ts';
import { lernstand } from '../eltern/statistik.ts';
import {
  extraRundeAuswaehlen,
  lektionsRundeAuswaehlen,
  rundeAuswaehlen,
  wortStand,
  type RundenWort,
  type WortStand,
} from '../vokabeln-en/leitner.ts';
import type { Zufall } from '../vokabeln-en/runde.ts';
import { loesungText } from './bewertung.ts';
import type { Aufgabe, Thema } from './typen.ts';

export type Wahl = { art: 'mix' } | { art: 'thema'; id: string };

export function fortschrittThema(
  thema: Thema,
  staende: ReadonlyMap<string, WortStand>,
): Fortschritt {
  const f: Fortschritt = { neu: 0, lernt: 0, sicher: 0, gesamt: thema.woerter.length };
  for (const a of thema.woerter) f[lernstand(wortStand(staende, thema.id, a.id))]++;
  return f;
}

// Mix: was fällig ist und ein paar neue Aufgaben aus allen Themen (in Heft-Reihenfolge);
// ist nichts mehr fällig, eine Extra-Runde mit schon Geübtem. Ein Thema: wie eine Lektion.
export function deutschAuswahl(
  wahl: Wahl,
  themen: readonly Thema[],
  staende: Map<string, WortStand>,
  heute: string,
  zufall: Zufall = Math.random,
): RundenWort<Thema>[] {
  if (wahl.art === 'thema') {
    const thema = themen.find((t) => t.id === wahl.id);
    return thema ? lektionsRundeAuswaehlen(thema, staende, heute, zufall) : [];
  }
  const normal = rundeAuswaehlen(themen, staende, heute);
  return normal.length > 0 ? normal : extraRundeAuswaehlen(themen, staende, zufall);
}

export function loesungVon(a: Aufgabe): string {
  if (a.art === 'waehlen') return a.richtig.join(' oder ');
  if (a.art === 'schreiben') return a.loesungen[0]!;
  return loesungText(a);
}
