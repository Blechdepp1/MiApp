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
  // Von den Eltern entfernt (falsch eingetragen); die Punkte bleiben trotzdem
  geloescht: boolean;
  punkte: { eintragen: number; ergebnis: number; verbesserung: number };
};

// Montag der Woche (Ortszeit) als Schlüssel, für die Obergrenze beim Eintragen
function woche(zeit: string): string {
  const d = new Date(zeit);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Alle Tests mit ihren Punkten. Punkte, die einmal vergeben sind, ändern sich durch spätere
// Ereignisse nicht mehr („nie Punkte abziehen“): Die Obergrenze fürs Eintragen zählt je Gerät,
// und Note und Verbesserung werden in der Reihenfolge der Bestätigungen festgelegt.
export function alleTests(ereignisse: readonly LernEreignis[]): TestEintrag[] {
  const tests = new Map<string, TestEintrag>();
  const eintraegeProWoche = new Map<string, number>();
  const letzteBestaetigteNote = new Map<TestFach, number>();
  const sortiert = [...ereignisse].sort(
    (a, b) => a.zeit.localeCompare(b.zeit) || a.id.localeCompare(b.id),
  );

  for (const e of sortiert) {
    if (e.typ === 'test-eingetragen') {
      const schluessel = `${e.geraet}|${woche(e.zeit)}`;
      const anzahl = (eintraegeProWoche.get(schluessel) ?? 0) + 1;
      eintraegeProWoche.set(schluessel, anzahl);
      tests.set(e.id, {
        id: e.id,
        fach: e.fach,
        art: e.art,
        datum: e.datum,
        ...(e.thema && { thema: e.thema }),
        ...(e.lektionId && { lektionId: e.lektionId }),
        eingetragen: e.zeit,
        bestaetigt: false,
        geloescht: false,
        punkte: {
          eintragen: anzahl <= EINTRAGEN_PRO_WOCHE ? TEST_PUNKTE.eintragen : 0,
          ergebnis: 0,
          verbesserung: 0,
        },
      });
    }
  }

  // Zweiter Durchgang: Noten, Bestätigungen und Löschungen (auch wenn eine Geräte-Uhr
  // nachgeht und sie zeitlich vor dem Eintrag liegen)
  for (const e of sortiert) {
    if (e.typ === 'test-geloescht') {
      const t = tests.get(e.testId);
      if (t) t.geloescht = true;
    } else if (e.typ === 'test-ergebnis') {
      // Bis zur Bestätigung gilt die zuletzt eingetragene Note (Kind oder Eltern korrigieren)
      const t = tests.get(e.testId);
      if (t && !t.bestaetigt) t.note = e.note;
    } else if (e.typ === 'test-bestaetigt') {
      // Bestätigt wird die Note, die die Eltern gesehen haben; danach steht sie fest
      const t = tests.get(e.testId);
      const note = e.note ?? t?.note;
      if (!t || t.bestaetigt || note === undefined) continue;
      t.note = note;
      t.bestaetigt = true;
      t.punkte.ergebnis = TEST_PUNKTE.ergebnis;
      const vorher = letzteBestaetigteNote.get(t.fach);
      if (vorher !== undefined && note < vorher) t.punkte.verbesserung = TEST_PUNKTE.verbesserung;
      letzteBestaetigteNote.set(t.fach, note);
    }
  }

  return [...tests.values()].sort((a, b) => b.datum.localeCompare(a.datum));
}

export function punkteFuerTest(t: TestEintrag): number {
  return t.punkte.eintragen + t.punkte.ergebnis + t.punkte.verbesserung;
}

export function testPunkte(ereignisse: readonly LernEreignis[]): number {
  return alleTests(ereignisse).reduce((summe, t) => summe + punkteFuerTest(t), 0);
}

// Tests, deren Termin vorbei ist (ab dem Tag danach) und die noch keine Note haben
export function ohneNote(tests: readonly TestEintrag[], heute: string): TestEintrag[] {
  return tests.filter((t) => !t.geloescht && t.note === undefined && t.datum < heute);
}

// Noten, die auf die Bestätigung der Eltern warten
export function zuBestaetigen(tests: readonly TestEintrag[]): TestEintrag[] {
  return tests.filter((t) => !t.geloescht && t.note !== undefined && !t.bestaetigt);
}

// Für Listen und Übersichten: entfernte Tests ausblenden
export function sichtbareTests(tests: readonly TestEintrag[]): TestEintrag[] {
  return tests.filter((t) => !t.geloescht);
}

// Lektionen, deren Test in den nächsten Tagen ansteht, werden in Runden bevorzugt
export function testVorrang(
  ereignisse: readonly LernEreignis[],
  heute: string,
  tage = VORRANG_TAGE_TEST,
): Set<string> {
  const ids = new Set<string>();
  for (const t of alleTests(ereignisse)) {
    if (!t.lektionId || t.geloescht) continue;
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
