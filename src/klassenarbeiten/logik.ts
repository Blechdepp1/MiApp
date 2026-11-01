import { EINTRAGEN_PRO_WOCHE, TEST_PUNKTE, VORRANG_TAGE_TEST } from '../belohnung/werte.ts';
import type { LernEreignis, TestArt, TestFach } from '../daten/ereignisse.ts';

// Klassenarbeiten und Tests (SPEC 10a), alles aus dem Ereignis-Protokoll berechnet.
// Punkte gibt es für Einsatz: Eintragen, Note nachtragen, Verbesserung im selben Fach.

export const FAECHER: { fach: TestFach; name: string; symbol: string }[] = [
  { fach: 'englisch', name: 'Englisch', symbol: '🇬🇧' },
  { fach: 'deutsch', name: 'Deutsch', symbol: '📖' },
  { fach: 'mathe', name: 'Mathe', symbol: '➗' },
  { fach: 'andere', name: 'Anderes Fach', symbol: '🎒' },
];

export const ARTEN: { art: TestArt; name: string }[] = [
  { art: 'klassenarbeit', name: 'Klassenarbeit' },
  { art: 'test', name: 'Test' },
  { art: 'vokabeltest', name: 'Vokabeltest' },
];

export const NOTEN = [1, 2, 3, 4, 5, 6] as const;

export type TestEintrag = {
  id: string;
  fach: TestFach;
  art: TestArt;
  datum: string;
  thema?: string;
  lektionId?: string;
  eingetragen: string;
  note?: number;
  bestaetigt: boolean;
  punkte: { eintragen: number; ergebnis: number; verbesserung: number };
};

// Montag der Woche (Ortszeit) als Schlüssel, für die Obergrenze beim Eintragen
function woche(zeit: string): string {
  const d = new Date(zeit);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function alleTests(ereignisse: readonly LernEreignis[]): TestEintrag[] {
  const tests = new Map<string, TestEintrag>();
  const eintraegeProWoche = new Map<string, number>();
  // Zeitlich sortiert, damit „zuerst eingetragen“ und „letzte Note“ eindeutig sind
  const sortiert = [...ereignisse].sort((a, b) => a.zeit.localeCompare(b.zeit));

  for (const e of sortiert) {
    if (e.typ !== 'test-eingetragen') continue;
    const w = woche(e.zeit);
    const anzahl = (eintraegeProWoche.get(w) ?? 0) + 1;
    eintraegeProWoche.set(w, anzahl);
    tests.set(e.id, {
      id: e.id,
      fach: e.fach,
      art: e.art,
      datum: e.datum,
      ...(e.thema && { thema: e.thema }),
      ...(e.lektionId && { lektionId: e.lektionId }),
      eingetragen: e.zeit,
      bestaetigt: false,
      punkte: {
        eintragen: anzahl <= EINTRAGEN_PRO_WOCHE ? TEST_PUNKTE.eintragen : 0,
        ergebnis: 0,
        verbesserung: 0,
      },
    });
  }
  for (const e of sortiert) {
    const t = e.typ === 'test-ergebnis' || e.typ === 'test-bestaetigt' ? tests.get(e.testId) : null;
    if (!t) continue;
    // Bis zur Bestätigung gilt die zuletzt eingetragene Note (Kind oder Eltern korrigieren),
    // danach steht sie fest; bestätigt wird nur, was schon eine Note hat
    if (e.typ === 'test-ergebnis' && !t.bestaetigt) t.note = e.note;
    if (e.typ === 'test-bestaetigt' && t.note !== undefined) t.bestaetigt = true;
  }

  // Ergebnis- und Verbesserungsbonus erst nach Bestätigung; verglichen wird mit der
  // letzten bestätigten Note im selben Fach (nach Datum des Tests)
  const letzteNote = new Map<TestFach, number>();
  const nachDatum = [...tests.values()].sort(
    (a, b) => a.datum.localeCompare(b.datum) || a.eingetragen.localeCompare(b.eingetragen),
  );
  for (const t of nachDatum) {
    if (!t.bestaetigt || t.note === undefined) continue;
    t.punkte.ergebnis = TEST_PUNKTE.ergebnis;
    const vorher = letzteNote.get(t.fach);
    if (vorher !== undefined && t.note < vorher) t.punkte.verbesserung = TEST_PUNKTE.verbesserung;
    letzteNote.set(t.fach, t.note);
  }

  return [...tests.values()].sort((a, b) => b.datum.localeCompare(a.datum));
}

export function punkteFuerTest(t: TestEintrag): number {
  return t.punkte.eintragen + t.punkte.ergebnis + t.punkte.verbesserung;
}

export function testPunkte(ereignisse: readonly LernEreignis[]): number {
  return alleTests(ereignisse).reduce((summe, t) => summe + punkteFuerTest(t), 0);
}

// Tests, deren Termin heute oder vorbei ist und für die noch keine Note eingetragen ist
export function ohneNote(tests: readonly TestEintrag[], heute: string): TestEintrag[] {
  return tests.filter((t) => t.note === undefined && t.datum <= heute);
}

// Noten, die auf die Bestätigung der Eltern warten
export function zuBestaetigen(tests: readonly TestEintrag[]): TestEintrag[] {
  return tests.filter((t) => t.note !== undefined && !t.bestaetigt);
}

// Lektionen, deren Test in den nächsten Tagen ansteht, werden in Runden bevorzugt
export function testVorrang(
  ereignisse: readonly LernEreignis[],
  heute: string,
  tage = VORRANG_TAGE_TEST,
): Set<string> {
  const ids = new Set<string>();
  for (const t of alleTests(ereignisse)) {
    if (!t.lektionId) continue;
    const differenz = (Date.parse(t.datum) - Date.parse(heute)) / 86_400_000;
    if (differenz >= 0 && differenz <= tage) ids.add(t.lektionId);
  }
  return ids;
}

export function fachName(fach: TestFach): string {
  return FAECHER.find((f) => f.fach === fach)?.name ?? fach;
}

export function artName(art: TestArt): string {
  return ARTEN.find((a) => a.art === art)?.name ?? art;
}

export function datumText(datum: string): string {
  return new Date(`${datum}T12:00:00`).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}
