// Bewertung einer geschriebenen Antwort, LRS-freundlich:
// Groß-/Kleinschreibung und Leerzeichen zählen nicht, ein vertauschter oder fehlender Buchstabe ist „fast richtig“.

export type Bewertung = 'richtig' | 'fast' | 'falsch';

// Unter dieser Länge wäre ein Buchstabe Unterschied schon ein anderes Wort (cat/car)
const MIN_LAENGE_FUER_FAST = 4;

function normal(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// "(to) go" → ["to go", "go"]; "big, large" → ["big", "large"]
export function erlaubteAntworten(loesung: string): string[] {
  const antworten = new Set<string>();
  for (const teil of loesung.split(/[,;/]/)) {
    const mit = normal(teil.replace(/[()]/g, ''));
    const ohne = normal(teil.replace(/\([^)]*\)/g, ''));
    if (mit) antworten.add(mit);
    if (ohne) antworten.add(ohne);
  }
  return [...antworten];
}

// Damerau-Levenshtein (mit Vertauschung benachbarter Buchstaben), begrenzt auf kleine Abstände
export function abstand(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
      let wert = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + kosten);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        wert = Math.min(wert, d[i - 2]![j - 2]! + 1);
      }
      d[i]![j] = wert;
    }
  }
  return d[a.length]![b.length]!;
}

export function bewerteSchreiben(eingabe: string, loesung: string): Bewertung {
  const antwort = normal(eingabe);
  if (!antwort) return 'falsch';
  const erlaubt = erlaubteAntworten(loesung);
  if (erlaubt.includes(antwort)) return 'richtig';
  const fast = erlaubt.some((l) => l.length >= MIN_LAENGE_FUER_FAST && abstand(antwort, l) === 1);
  return fast ? 'fast' : 'falsch';
}
