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

// Richtige Antwort plus zwei andere Wörter aus den Listen, gemischt
export function antwortOptionen(
  richtig: Vokabel,
  alle: readonly Vokabel[],
  feld: 'de' | 'en',
  zufall: Zufall = Math.random,
  anzahl = 3,
): Vokabel[] {
  const andere = mische(
    alle.filter((w) => w.id !== richtig.id && w[feld] !== richtig[feld]),
    zufall,
  );
  const ohneDoppelte = andere.filter((w, i) => andere.findIndex((x) => x[feld] === w[feld]) === i);
  return mische([richtig, ...ohneDoppelte.slice(0, anzahl - 1)], zufall);
}

// Was gesprochen wird: „(to) play“ → „to play“
export function sprechtext(text: string): string {
  return text.replace(/[()]/g, '');
}
