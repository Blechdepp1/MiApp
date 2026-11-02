import type { WortStand } from './leitner.ts';

// Rückmeldung nach einer richtigen Antwort, die sagt, was passiert ist (V12): informierende
// Rückmeldung wirkt stärker als reines Lob. Ohne Besonderheit wechselt das Lob ab.
const LOB = ['Richtig! Super gemacht!', 'Stimmt genau!', 'Richtig! Klasse!'] as const;

export function lobText(
  vorher: WortStand,
  nachher: WortStand,
  {
    mitHilfe = false,
    verbessert = false,
    nr = 0,
    heute,
  }: {
    mitHilfe?: boolean;
    verbessert?: boolean;
    // Position in der Runde, damit das Lob abwechselt
    nr?: number;
    heute: string;
  },
): string {
  if (mitHilfe) return 'Richtig, mit Hilfe! Morgen probierst du es noch einmal allein.';
  if (verbessert) return 'Richtig! Neulich war das noch schwer, jetzt kannst du es.';
  if (vorher.fach === 0) return 'Richtig! Das ist neu für dich, und du hast es geschafft.';
  if (nachher.fach > vorher.fach) {
    const tage = Math.round((Date.parse(nachher.faelligAb) - Date.parse(heute)) / 86_400_000);
    if (tage >= 7) return `Richtig! Das sitzt. Es kommt erst in ${tage} Tagen wieder.`;
    if (tage > 1) return `Richtig! Es kommt in ${tage} Tagen wieder.`;
  }
  return LOB[nr % LOB.length]!;
}
