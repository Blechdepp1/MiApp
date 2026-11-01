import type { LernEreignis } from '../daten/ereignisse.ts';
import {
  LEVEL_START,
  PUNKTE,
  PUNKTE_PRO_STERN,
  TAGESZIEL_RUNDEN,
  type Levelstufe,
} from './werte.ts';

type Runde = Extract<LernEreignis, { typ: 'runde-beendet' }>;

export function punkteFuerRunde(r: Pick<Runde, 'richtig' | 'mitHilfe' | 'verbessert'>): number {
  return (
    PUNKTE.runde +
    r.richtig * PUNKTE.richtig +
    r.mitHilfe * PUNKTE.mitHilfe +
    r.verbessert * PUNKTE.verbessert
  );
}

// Kalendertag in der Zeitzone des Geräts, z. B. "2026-11-01"
export function tagVon(zeit: string): string {
  const d = new Date(zeit);
  const zwei = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
}

function rundenProTag(ereignisse: readonly LernEreignis[]): Map<string, number> {
  const tage = new Map<string, number>();
  for (const e of ereignisse) {
    if (e.typ === 'runde-beendet') tage.set(tagVon(e.zeit), (tage.get(tagVon(e.zeit)) ?? 0) + 1);
  }
  return tage;
}

// Gesamtpunkte sinken nie: Fehler und Einlösungen ziehen nichts ab
export function gesamtPunkte(ereignisse: readonly LernEreignis[]): number {
  let summe = 0;
  for (const e of ereignisse) if (e.typ === 'runde-beendet') summe += punkteFuerRunde(e);
  for (const runden of rundenProTag(ereignisse).values()) {
    if (runden >= TAGESZIEL_RUNDEN) summe += PUNKTE.tagesziel;
  }
  return summe;
}

export function guthaben(ereignisse: readonly LernEreignis[]): number {
  const ausgegeben = ereignisse.reduce((s, e) => (e.typ === 'eingeloest' ? s + e.preis : s), 0);
  return gesamtPunkte(ereignisse) - ausgegeben;
}

export type Einloesung = {
  id: string;
  belohnungId: string;
  preis: number;
  name?: string;
  symbol?: string;
  zeit: string;
  bestaetigt: boolean;
};

// Alle Einlösungen, neueste zuerst; bestätigt ist eine, zu der es ein „bestaetigt“-Ereignis gibt
export function einloesungen(ereignisse: readonly LernEreignis[]): Einloesung[] {
  const bestaetigt = new Set(
    ereignisse.flatMap((e) => (e.typ === 'bestaetigt' ? [e.einloesungId] : [])),
  );
  return ereignisse
    .flatMap((e) =>
      e.typ === 'eingeloest'
        ? [
            {
              id: e.id,
              belohnungId: e.belohnungId,
              preis: e.preis,
              name: e.name,
              symbol: e.symbol,
              zeit: e.zeit,
              bestaetigt: bestaetigt.has(e.id),
            },
          ]
        : [],
    )
    .sort((a, b) => b.zeit.localeCompare(a.zeit));
}

export function tagesziel(ereignisse: readonly LernEreignis[], heute: string) {
  const runden = rundenProTag(ereignisse).get(heute) ?? 0;
  return { runden, ziel: TAGESZIEL_RUNDEN, erreicht: runden >= TAGESZIEL_RUNDEN };
}

export type Level = {
  nummer: number;
  titel: string;
  sterne: number;
  // Punkte, ab denen das aktuelle bzw. nächste Level (oder der nächste Stern) beginnt
  ab: number;
  naechstesAb: number;
  fortschritt: number;
};

// Vergleichbarer Rang: Level zählt vor Sternen
export function rang(l: Pick<Level, 'nummer' | 'sterne'>): number {
  return l.nummer * 1000 + l.sterne;
}

// Wohin der Fortschrittsbalken führt: nächstes Level oder nächster Stern
export function naechstesZiel(l: Level, tabelle: readonly Levelstufe[] = LEVEL_START): string {
  return tabelle[l.nummer]?.titel ?? 'zum nächsten Stern';
}

export function level(punkte: number, tabelle: readonly Levelstufe[] = LEVEL_START): Level {
  let index = 0;
  tabelle.forEach((stufe, i) => {
    if (punkte >= stufe.ab) index = i;
  });
  const stufe = tabelle[index]!;
  const letzte = index === tabelle.length - 1;

  let ab = stufe.ab;
  let naechstesAb: number;
  let sterne = 0;
  if (letzte) {
    sterne = Math.floor((punkte - stufe.ab) / PUNKTE_PRO_STERN);
    ab = stufe.ab + sterne * PUNKTE_PRO_STERN;
    naechstesAb = ab + PUNKTE_PRO_STERN;
  } else {
    naechstesAb = tabelle[index + 1]!.ab;
  }
  return {
    nummer: index + 1,
    titel: stufe.titel,
    sterne,
    ab,
    naechstesAb,
    fortschritt: (punkte - ab) / (naechstesAb - ab),
  };
}
