import type { Vokabel } from './typen.ts';

export type Zufall = () => number;

export function mische<T>(liste: readonly T[], zufall: Zufall = Math.random): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j]!, kopie[i]!];
  }
  return kopie;
}

// Richtige Antwort plus zwei andere Wörter aus den Listen, gemischt. Bei Verbformen sind die
// anderen Formen desselben Verbs die Auswahl (went: go, went, gone), bei normalen Vokabeln andere
// Vokabeln statt Verbformen.
export function antwortOptionen(
  richtig: Vokabel,
  alle: readonly Vokabel[],
  feld: 'de' | 'en',
  zufall: Zufall = Math.random,
  anzahl = 3,
): Vokabel[] {
  const kandidaten = alle.filter((w) => w.id !== richtig.id && w[feld] !== richtig[feld]);
  const passend = (w: Vokabel) =>
    richtig.gruppe ? w.gruppe === richtig.gruppe : w.gruppe === undefined;
  const andere = [
    ...mische(kandidaten.filter(passend), zufall),
    ...mische(
      kandidaten.filter((w) => !passend(w)),
      zufall,
    ),
  ];
  const ohneDoppelte = andere.filter((w, i) => andere.findIndex((x) => x[feld] === w[feld]) === i);
  return mische([richtig, ...ohneDoppelte.slice(0, anzahl - 1)], zufall);
}

// Was gesprochen wird: „(to) play“ → „to play“
export function sprechtext(text: string): string {
  return text.replace(/[()]/g, '');
}
