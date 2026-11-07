import { level, punkteFuerRunde, rang, tagVon } from '../belohnung/logik.ts';
import { LEVEL_START, PUNKTE, TAGESZIEL_RUNDEN, type Levelstufe } from '../belohnung/werte.ts';
import type { LernEreignis } from '../daten/ereignisse.ts';
import { alleTests, artName, fachName, type TestEintrag } from '../klassenarbeiten/logik.ts';
import { plusTage } from '../vokabeln-en/leitner.ts';

// Was Milena wann geschafft hat, für die Seite „Meine Erfolge“. Die Punkte aller Einträge ergeben
// zusammen genau die Gesamtpunkte (gesamtPunkte); Einlösungen und Meilensteine haben 0 Punkte.

export type Gutschrift = {
  zeit: string;
  art: 'runde' | 'tagesziel' | 'test' | 'level' | 'eingeloest';
  punkte: number;
  symbol: string;
  text: string;
};

const RUNDE = {
  englisch: { symbol: '📚', text: 'Vokabelrunde geschafft' },
  deutsch: { symbol: '✏️', text: 'Deutschrunde geschafft' },
  mathe: { symbol: '➗', text: 'Matherunde geschafft' },
} as const;

function testName(t: Pick<TestEintrag, 'art' | 'fach'>) {
  return `${artName(t.art)} in ${fachName(t.fach)}`;
}

// Alle Einträge in zeitlicher Reihenfolge
export function gutschriften(
  ereignisse: readonly LernEreignis[],
  stufen: readonly Levelstufe[] = LEVEL_START,
): Gutschrift[] {
  const sortiert = [...ereignisse].sort(
    (a, b) => a.zeit.localeCompare(b.zeit) || a.id.localeCompare(b.id),
  );
  const tests = new Map(alleTests(ereignisse).map((t) => [t.id, t]));
  const rundenAmTag = new Map<string, number>();
  const bestaetigt = new Set<string>();
  const liste: Gutschrift[] = [];

  for (const e of sortiert) {
    if (e.typ === 'runde-beendet') {
      liste.push({
        zeit: e.zeit,
        art: 'runde',
        punkte: punkteFuerRunde(e),
        symbol: RUNDE[e.fach ?? 'englisch'].symbol,
        text: RUNDE[e.fach ?? 'englisch'].text,
      });
      const tag = tagVon(e.zeit);
      const runden = (rundenAmTag.get(tag) ?? 0) + 1;
      rundenAmTag.set(tag, runden);
      if (runden === TAGESZIEL_RUNDEN) {
        liste.push({
          zeit: e.zeit,
          art: 'tagesziel',
          punkte: PUNKTE.tagesziel,
          symbol: '🎯',
          text: 'Tagesziel geschafft',
        });
      }
    } else if (e.typ === 'test-eingetragen') {
      const t = tests.get(e.id);
      if (t && t.punkte.eintragen > 0) {
        liste.push({
          zeit: e.zeit,
          art: 'test',
          punkte: t.punkte.eintragen,
          symbol: '📝',
          text: `${testName(t)} eingetragen`,
        });
      }
    } else if (e.typ === 'test-bestaetigt') {
      const t = tests.get(e.testId);
      if (!t?.bestaetigt || bestaetigt.has(t.id)) continue;
      bestaetigt.add(t.id);
      liste.push({
        zeit: e.zeit,
        art: 'test',
        punkte: t.punkte.ergebnis,
        symbol: '✅',
        text: `Note für ${testName(t)} eingetragen`,
      });
      if (t.punkte.verbesserung > 0) {
        liste.push({
          zeit: e.zeit,
          art: 'test',
          punkte: t.punkte.verbesserung,
          symbol: '📈',
          text: `Besser als beim letzten Mal in ${fachName(t.fach)}!`,
        });
      }
    } else if (e.typ === 'eingeloest') {
      liste.push({
        zeit: e.zeit,
        art: 'eingeloest',
        punkte: 0,
        symbol: e.symbol ?? '🎁',
        text: `${e.name ?? 'Belohnung'} eingelöst`,
      });
    }
  }

  // Meilensteine: neues Level oder neuer Stern, sobald die Punkte die Schwelle erreichen
  const mitLevel: Gutschrift[] = [];
  let summe = 0;
  for (const g of liste) {
    const vorher = level(summe, stufen);
    summe += g.punkte;
    mitLevel.push(g);
    const nachher = level(summe, stufen);
    if (rang(nachher) > rang(vorher)) {
      mitLevel.push({
        zeit: g.zeit,
        art: 'level',
        punkte: 0,
        symbol: nachher.sterne > vorher.sterne ? '⭐' : '🏅',
        text:
          nachher.nummer > vorher.nummer
            ? `Level ${nachher.nummer} erreicht: ${nachher.titel}`
            : `Neuer Stern als ${nachher.titel}!`,
      });
    }
  }
  return mitLevel;
}

export type Tag = {
  tag: string;
  punkte: number;
  runden: number;
  tagesziel: boolean;
  // Neueste zuerst
  eintraege: Gutschrift[];
};

// Tage mit Einträgen, neuester zuerst
export function tageMitErfolgen(liste: readonly Gutschrift[]): Tag[] {
  const tage = new Map<string, Tag>();
  for (const g of liste) {
    const schluessel = tagVon(g.zeit);
    const tag = tage.get(schluessel) ?? {
      tag: schluessel,
      punkte: 0,
      runden: 0,
      tagesziel: false,
      eintraege: [],
    };
    tag.punkte += g.punkte;
    if (g.art === 'runde') tag.runden++;
    if (g.art === 'tagesziel') tag.tagesziel = true;
    tag.eintraege.unshift(g);
    tage.set(schluessel, tag);
  }
  return [...tage.values()].sort((a, b) => b.tag.localeCompare(a.tag));
}

// Mehrere Runden eines Tages als eine Zeile („3 Vokabelrunden geschafft“), an der Stelle der letzten
export function zusammengefasst(eintraege: readonly Gutschrift[]): Gutschrift[] {
  // Je Fach getrennt: „3 Vokabelrunden“, „2 Deutschrunden“
  const gruppen = new Map<string, Gutschrift[]>();
  for (const g of eintraege) {
    if (g.art === 'runde') gruppen.set(g.text, [...(gruppen.get(g.text) ?? []), g]);
  }
  const ergebnis: Gutschrift[] = [];
  for (const g of eintraege) {
    if (g.art !== 'runde') {
      ergebnis.push(g);
      continue;
    }
    const gruppe = gruppen.get(g.text)!;
    if (gruppe.length === 1) ergebnis.push(g);
    else if (g === gruppe[0])
      ergebnis.push({
        ...g,
        punkte: gruppe.reduce((s, r) => s + r.punkte, 0),
        text: `${gruppe.length} ${g.text.replace('runde geschafft', 'runden geschafft')}`,
      });
  }
  return ergebnis;
}

// Montag der Woche, in der `tag` liegt
export function wochenAnfang(tag: string): string {
  const wochentag = new Date(`${tag}T12:00:00`).getDay();
  return plusTage(tag, -((wochentag + 6) % 7));
}

export type Woche = {
  // Montag bis Sonntag
  tage: { tag: string; punkte: number; tagesziel: boolean }[];
  punkte: number;
  letzteWoche: number;
};

export function woche(tage: readonly Tag[], heute: string): Woche {
  const nachTag = new Map(tage.map((t) => [t.tag, t]));
  const summe = (montag: string) =>
    Array.from({ length: 7 }, (_, i) => nachTag.get(plusTage(montag, i))?.punkte ?? 0).reduce(
      (a, b) => a + b,
      0,
    );
  const montag = wochenAnfang(heute);
  return {
    tage: Array.from({ length: 7 }, (_, i) => {
      const t = nachTag.get(plusTage(montag, i));
      return { tag: plusTage(montag, i), punkte: t?.punkte ?? 0, tagesziel: !!t?.tagesziel };
    }),
    punkte: summe(montag),
    letzteWoche: summe(plusTage(montag, -7)),
  };
}

export type KalenderTag = { tag: string; geuebt: boolean; tagesziel: boolean } | null;

// Monatsblatt ab Montag; null für leere Felder vor dem 1.
export function kalender(tage: readonly Tag[], jahr: number, monat: number): KalenderTag[] {
  const nachTag = new Map(tage.map((t) => [t.tag, t]));
  const erster = tagVon(new Date(jahr, monat, 1, 12).toISOString());
  const anzahl = new Date(jahr, monat + 1, 0).getDate();
  const leer = (new Date(jahr, monat, 1).getDay() + 6) % 7;
  return [
    ...Array.from({ length: leer }, () => null),
    ...Array.from({ length: anzahl }, (_, i) => {
      const tag = plusTage(erster, i);
      const t = nachTag.get(tag);
      return { tag, geuebt: (t?.runden ?? 0) > 0, tagesziel: !!t?.tagesziel };
    }),
  ];
}
