import type { MatheThema, RechenAufgabe } from './typen.ts';

// Einmaleins nach Reihen. Jede Reihe n enthält k · n und (k · n) : n für k = 1 … 10, so kommt jede
// Malaufgabe genau einmal vor (7 · 8 in der 8er-Reihe, 8 · 7 in der 7er-Reihe).
// Reihenfolge wie im Unterricht: erst die Kernreihen, dann die abgeleiteten.
export const REIHEN = [2, 5, 10, 4, 3, 6, 9, 8, 7] as const;

export const ZEICHEN = { mal: '·', geteilt: ':' } as const;

export function aufgabeText(a: Pick<RechenAufgabe, 'a' | 'b' | 'op'>): string {
  return `${a.a} ${ZEICHEN[a.op]} ${a.b}`;
}

// So wird die Aufgabe vorgelesen: „7 mal 8“, „56 geteilt durch 8“
export function sprechText(a: Pick<RechenAufgabe, 'a' | 'b' | 'op'>): string {
  return `${a.a} ${a.op === 'mal' ? 'mal' : 'geteilt durch'} ${a.b}`;
}

// Wie leicht sich mit einem Faktor rechnen lässt (Kernaufgaben zuerst)
const LEICHT = [1, 10, 2, 5, 4, 3, 9, 6, 8, 7];

// Rechentrick für k · x, ohne das Ergebnis zu verraten: Kernaufgaben (·1, ·2, ·5, ·10)
// und daraus abgeleitet (Nachbaraufgaben, Verdoppeln)
function trick(k: number, x: number): string {
  switch (k) {
    case 1:
      return `1 mal eine Zahl ist die Zahl selbst.`;
    case 2:
      return `Verdopple: ${x} + ${x}.`;
    case 5:
      return `Die Hälfte von 10 · ${x} = ${10 * x}.`;
    case 10:
      return `Bei mal 10 hängst du eine 0 an.`;
    case 3:
      return `Rechne 2 · ${x} = ${2 * x}, dann noch + ${x}.`;
    case 4:
      return `Verdopple 2 · ${x} = ${2 * x}.`;
    case 6:
      return `Rechne 5 · ${x} = ${5 * x}, dann noch + ${x}.`;
    case 7:
      return `Rechne 5 · ${x} = ${5 * x} und 2 · ${x} = ${2 * x}, dann zusammen.`;
    case 8:
      return `Rechne 10 · ${x} = ${10 * x}, dann − 2 · ${x} = ${2 * x}.`;
    case 9:
      return `Rechne 10 · ${x} = ${10 * x}, dann − ${x}.`;
    default:
      return '';
  }
}

export function malTipp(k: number, n: number): string {
  // Mit dem leichteren Faktor rechnen; ist das der zweite, hilft die Tauschaufgabe
  if (LEICHT.indexOf(n) < LEICHT.indexOf(k)) {
    return `Tauschaufgabe: ${k} · ${n} = ${n} · ${k}. ${trick(n, k)}`;
  }
  return trick(k, n);
}

function reihe(n: number): MatheThema {
  const mal: RechenAufgabe[] = [];
  const geteilt: RechenAufgabe[] = [];
  for (let k = 1; k <= 10; k++) {
    mal.push({ id: `${k}x${n}`, a: k, b: n, op: 'mal', ergebnis: k * n, hilfe: malTipp(k, n) });
    geteilt.push({
      id: `${k * n}d${n}`,
      a: k * n,
      b: n,
      op: 'geteilt',
      ergebnis: k,
      hilfe: `Welche Zahl mal ${n} ergibt ${k * n}? Geh die ${n}er-Reihe durch: ${n}, ${2 * n}, ${3 * n} …`,
    });
  }
  return {
    id: `ma-reihe-${n}`,
    titel: `${n}er-Reihe`,
    symbol: '✖️',
    merkwissen: merkwissen(n),
    woerter: [...mal, ...geteilt],
  };
}

function merkwissen(n: number): string[] {
  const reihe = Array.from({ length: 10 }, (_, i) => (i + 1) * n).join(', ');
  const tipps: Record<number, string> = {
    2: 'Mal 2 heißt verdoppeln.',
    5: 'Mal 5 ist die Hälfte von mal 10. Die Ergebnisse enden immer auf 0 oder 5.',
    10: 'Mal 10: eine 0 anhängen.',
    4: 'Mal 4 heißt zweimal verdoppeln.',
    3: 'Mal 3 ist mal 2 und noch einmal dazu.',
    6: 'Mal 6 ist mal 5 und noch einmal dazu.',
    9: 'Mal 9 ist mal 10 und einmal weniger.',
    8: 'Mal 8 ist zweimal mal 4, oder mal 10 und zweimal weniger.',
    7: 'Mal 7 ist mal 5 und mal 2 zusammen.',
  };
  return [
    `Die ${n}er-Reihe: ${reihe}.`,
    tipps[n]!,
    'Geteilt ist die Umkehrung: Wenn 7 · 8 = 56, dann ist 56 : 8 = 7.',
  ];
}

export const EINMALEINS: MatheThema[] = REIHEN.map(reihe);

// Drei Antworten zum Auswählen: das Ergebnis und typische Verwechsler aus der Nachbarschaft
// (eine Reihe daneben: 7 · 8 → 48, 64, 49, 63; beim Teilen eins daneben)
export function antwortOptionen(a: RechenAufgabe, zufall: () => number = Math.random): number[] {
  const e = a.ergebnis;
  const nachbarn = a.op === 'mal' ? [e - a.b, e + a.b, e - a.a, e + a.a] : [e - 1, e + 1, e + 2];
  const andere = [...new Set(nachbarn.filter((n) => n > 0 && n !== e))]
    .map((n) => ({ n, los: zufall() }))
    .sort((x, y) => x.los - y.los)
    .slice(0, 2)
    .map(({ n }) => n);
  return [e, ...andere].sort((x, y) => x - y);
}
