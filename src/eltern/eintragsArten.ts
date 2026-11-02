import type { EnglischInhalt, Verb } from '../lektionen/lektion.ts';
import type { Vokabel } from '../vokabeln-en/typen.ts';

// Einträge einer Englisch-Lektion bearbeiten: Wortpaare oder unregelmäßige Verben (drei Formen)
export type Art = EnglischInhalt['art'];
export type Eintrag = Vokabel | Verb;

export const NAME: Record<Art, { einer: string; viele: string }> = {
  vokabeln: { einer: 'Wort', viele: 'Wörter' },
  verben: { einer: 'Verb', viele: 'Verben' },
};

export function eintraegeVon(inhalt: EnglischInhalt): Eintrag[] {
  return inhalt.art === 'verben' ? inhalt.verben : inhalt.woerter;
}

export function inhaltAus(art: Art, eintraege: readonly Eintrag[]): EnglischInhalt {
  return art === 'verben'
    ? { art, verben: (eintraege as Verb[]).map(bereinigeVerb) }
    : {
        art,
        woerter: (eintraege as Vokabel[]).map((w) => ({ ...w, en: w.en.trim(), de: w.de.trim() })),
      };
}

function bereinigeVerb(v: Verb): Verb {
  return {
    ...v,
    de: v.de.trim(),
    formen: v.formen.map((f) => f.trim()) as Verb['formen'],
  };
}

export function leererEintrag(art: Art): Eintrag {
  const id = crypto.randomUUID();
  return art === 'verben' ? { id, de: '', formen: ['', '', ''] } : { id, en: '', de: '' };
}

// Zum Erkennen von Doppelten beim Einfügen
export function vergleichsText(e: Eintrag): string {
  return ('formen' in e ? [...e.formen, e.de] : [e.en, e.de]).join('|').toLowerCase();
}
