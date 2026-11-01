// Eine eingefügte Wortliste lesen: eine Zeile pro Paar, Englisch zuerst.
// Erlaubte Trenner: Tabulator, Gedankenstrich, „ - “, „=“, „;“ (z. B. aus Word, Excel oder WhatsApp).
const TRENNER = /\t|\s+[–—-]\s+|\s*=\s*|\s*;\s*/;

export type GeleseneListe = { paare: { en: string; de: string }[]; fehler: string[] };

export function liesWortliste(text: string): GeleseneListe {
  const paare: { en: string; de: string }[] = [];
  const fehler: string[] = [];
  for (const roh of text.split(/\r?\n/)) {
    const zeile = roh.replace(/^\s*(?:\d+[.)]|[-•*])\s+/, '').trim();
    if (!zeile) continue;
    const treffer = TRENNER.exec(zeile);
    const en = treffer ? zeile.slice(0, treffer.index).trim() : '';
    const de = treffer ? zeile.slice(treffer.index + treffer[0].length).trim() : '';
    if (!en || !de) {
      fehler.push(zeile);
      continue;
    }
    paare.push({ en: en.replace(/\s+/g, ' '), de: de.replace(/\s+/g, ' ') });
  }
  return { paare, fehler };
}
