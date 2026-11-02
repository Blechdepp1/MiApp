import type { AntippAufgabe, SchreibAufgabe, WaehlAufgabe } from './typen.ts';

// Die App bewertet selbst. Groß- und Kleinschreibung zählt, denn sie ist Lernziel (Wortarten!).
// Ein Fehler, der nur an groß/klein oder an einem fehlenden Umlaut liegt, bekommt einen eigenen,
// freundlichen Hinweis; für den Wiederholungsplan zählt er trotzdem als nicht gewusst.

export type Hinweis = 'gross-klein' | 'umlaut' | 'leerzeichen';
export type SchreibErgebnis = { richtig: boolean; hinweis?: Hinweis };

export const HINWEIS_TEXT: Record<Hinweis, string> = {
  'gross-klein':
    'Fast! Achte auf groß und klein. Nomen schreibt man groß, Verben und Adjektive klein.',
  umlaut: 'Fast! Denk an ä, ö oder ü.',
  leerzeichen: 'Fast! Zusammengesetzte Nomen schreibt man ohne Lücke.',
};

// Rand-Leerzeichen, doppelte Leerzeichen und Satzzeichen am Ende spielen keine Rolle
export function normalisiere(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.!?,;:]+$/, '')
    .trim();
}

function ohneUmlaute(text: string): string {
  return text
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/Ä/g, 'A')
    .replace(/Ö/g, 'O')
    .replace(/Ü/g, 'U');
}

export function bewerteSchreiben(eingabe: string, aufgabe: SchreibAufgabe): SchreibErgebnis {
  const e = normalisiere(eingabe);
  const loesungen = aufgabe.loesungen.map(normalisiere);
  if (loesungen.includes(e)) return { richtig: true };
  if (loesungen.some((l) => l.toLowerCase() === e.toLowerCase()))
    return { richtig: false, hinweis: 'gross-klein' };
  if (loesungen.some((l) => ohneUmlaute(l).toLowerCase() === ohneUmlaute(e).toLowerCase()))
    return { richtig: false, hinweis: 'umlaut' };
  if (loesungen.some((l) => l.toLowerCase() === e.replace(/ /g, '').toLowerCase()))
    return { richtig: false, hinweis: 'leerzeichen' };
  return { richtig: false };
}

export function bewerteWaehlen(antwort: string, aufgabe: WaehlAufgabe): boolean {
  return aufgabe.richtig.includes(antwort);
}

// Wörter des Satzes (nach Leerzeichen getrennt); angezeigt mit Satzzeichen
export function woerterIm(satz: string): string[] {
  return satz.split(' ');
}

// Ohne kern: genau die richtigen Wörter. Mit kern (Wortgruppe wie „Die Kinder“): alle Kernwörter
// getroffen und nichts außerhalb der Gruppe angetippt.
export function bewerteAntippen(gewaehlt: readonly number[], aufgabe: AntippAufgabe): boolean {
  const auswahl = new Set(gewaehlt);
  const richtig = new Set(aufgabe.richtig);
  if (!aufgabe.kern) {
    return auswahl.size === richtig.size && [...auswahl].every((i) => richtig.has(i));
  }
  return [...auswahl].every((i) => richtig.has(i)) && aufgabe.kern.every((i) => auswahl.has(i));
}

// Lösung als Text, z. B. für die Rückmeldung und zum Vorlesen
// (nebeneinanderliegende Wörter wie „Die Kinder“ bleiben zusammen, sonst mit Komma getrennt)
export function loesungText(aufgabe: AntippAufgabe): string {
  const woerter = woerterIm(aufgabe.satz);
  const gruppen: string[][] = [];
  const sortiert = [...aufgabe.richtig].sort((a, b) => a - b);
  sortiert.forEach((index, i) => {
    const wort = woerter[index]!.replace(/[.,!?]+$/, '');
    if (i > 0 && index === sortiert[i - 1]! + 1) gruppen.at(-1)!.push(wort);
    else gruppen.push([wort]);
  });
  return gruppen.map((g) => g.join(' ')).join(', ');
}
