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

export type GeleseneVerben = {
  verben: { de: string; formen: [string, string, string] }[];
  fehler: string[];
};

// Unregelmäßige Verben: eine Zeile pro Verb, „go – went – gone – gehen“ (drei Formen, dann Deutsch)
export function liesVerbliste(text: string): GeleseneVerben {
  const verben: GeleseneVerben['verben'] = [];
  const fehler: string[] = [];
  for (const roh of text.split(/\r?\n/)) {
    const zeile = roh.replace(/^\s*(?:\d+[.)]|[-•*])\s+/, '').trim();
    if (!zeile) continue;
    const teile = zeile
      .split(new RegExp(TRENNER.source, 'g'))
      .map((t) => t.trim().replace(/\s+/g, ' '));
    if (teile.length !== 4 || teile.some((t) => !t)) {
      fehler.push(zeile);
      continue;
    }
    const [grund, vergangen, partizip, de] = teile as [string, string, string, string];
    verben.push({ de, formen: [grund, vergangen, partizip] });
  }
  return { verben, fehler };
}
