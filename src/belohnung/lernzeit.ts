import type { LernEreignis } from '../daten/ereignisse.ts';
import { lernPunkte } from './logik.ts';

// Schätzung, solange es zu wenige echte Runden gibt: 2 Runden in ~10 Minuten ≈ 90 Punkte
export const STANDARD_PUNKTE_PRO_MINUTE = 9;
export const MIN_RUNDEN_FUER_MESSUNG = 3;

// Länger als das zählt nicht (App offen liegen gelassen), kürzer als 1 Minute ist unrealistisch
const MAX_RUNDE_MS = 30 * 60_000;
const MIN_RUNDE_MS = 60_000;

export type Lernrate = { punkteProMinute: number; gemessen: boolean; runden: number };

// Dauer einer Runde: von der ersten Antwort nach der vorigen Runde bis zum Rundenende (pro Gerät)
export function rundenMitDauer(
  ereignisse: readonly LernEreignis[],
): { ende: string; dauerMs: number }[] {
  const runden: { ende: string; dauerMs: number }[] = [];
  const ersteAntwort = new Map<string, number>();
  for (const e of ereignisse) {
    const zeit = Date.parse(e.zeit);
    if (e.typ === 'antwort' && !ersteAntwort.has(e.geraet)) ersteAntwort.set(e.geraet, zeit);
    if (e.typ === 'runde-beendet') {
      const start = ersteAntwort.get(e.geraet);
      ersteAntwort.delete(e.geraet);
      if (start === undefined) continue;
      runden.push({
        ende: e.zeit,
        dauerMs: Math.min(MAX_RUNDE_MS, Math.max(MIN_RUNDE_MS, zeit - start)),
      });
    }
  }
  return runden;
}

export function rundenDauernMs(ereignisse: readonly LernEreignis[]): number[] {
  return rundenMitDauer(ereignisse).map((r) => r.dauerMs);
}

export function lernrate(ereignisse: readonly LernEreignis[]): Lernrate {
  const dauern = rundenDauernMs(ereignisse);
  if (dauern.length < MIN_RUNDEN_FUER_MESSUNG) {
    return { punkteProMinute: STANDARD_PUNKTE_PRO_MINUTE, gemessen: false, runden: dauern.length };
  }
  const minuten = dauern.reduce((s, d) => s + d, 0) / 60_000;
  return {
    punkteProMinute: lernPunkte(ereignisse) / minuten,
    gemessen: true,
    runden: dauern.length,
  };
}

// „≈ 25 Min.“ oder „≈ 2 Std. 30 Min.“, auf 5 Minuten gerundet
export function lernzeitText(punkte: number, punkteProMinute: number): string {
  const minuten = Math.max(5, Math.round(punkte / punkteProMinute / 5) * 5);
  if (minuten < 60) return `≈ ${minuten} Min.`;
  const stunden = Math.floor(minuten / 60);
  const rest = minuten % 60;
  return rest ? `≈ ${stunden} Std. ${rest} Min.` : `≈ ${stunden} Std.`;
}
