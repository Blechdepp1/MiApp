// Lern-Ereignisse: Jede Aktion wird als Eintrag gespeichert, Punkte und Fortschritt werden daraus berechnet.
// Jedes Gerät schreibt nur eigene Ereignisse; beim Sync werden die Protokolle anhand der id zusammengeführt.

// Englisch: erkennen, waehlen-de-en, schreiben. Deutsch (Grammatik): auswählen, schreiben, im Satz antippen.
export type Uebung =
  'erkennen' | 'waehlen-de-en' | 'schreiben' | 'de-waehlen' | 'de-schreiben' | 'de-antippen';

type Basis = { id: string; geraet: string; zeit: string };

export type EreignisDaten =
  | {
      typ: 'antwort';
      listeId: string;
      wortId: string;
      uebung: Uebung;
      richtig: boolean;
      fastRichtig?: boolean;
      mitHilfe?: boolean;
    }
  // fach fehlt bei Englisch-Runden (auch bei allen älteren)
  | {
      typ: 'runde-beendet';
      richtig: number;
      mitHilfe: number;
      verbessert: number;
      fach?: 'deutsch';
    }
  // Name und Symbol werden mitgespeichert, damit die Liste auch nach Änderungen an den Belohnungen stimmt
  | { typ: 'eingeloest'; belohnungId: string; preis: number; name?: string; symbol?: string }
  | { typ: 'bestaetigt'; einloesungId: string }
  // Rückmeldung von Milena (Smiley, Satz) oder ein automatisch gemeldeter technischer Fehler
  | {
      typ: 'feedback';
      art: 'rueckmeldung' | 'fehler';
      stimmung?: Stimmung;
      text?: string;
      seite: string;
      version: string;
      geraetInfo?: string;
      // Wer es geschickt hat (Gerät des Kindes oder der Eltern)
      rolle?: 'kind' | 'eltern';
    }
  | { typ: 'feedback-erledigt'; feedbackId: string }
  // Klassenarbeiten und Tests (SPEC 10a): eintragen, Note nachtragen, Eltern bestätigen
  | {
      typ: 'test-eingetragen';
      fach: TestFach;
      art: TestArt;
      // Kalendertag, z. B. "2026-11-12"
      datum: string;
      thema?: string;
      lektionId?: string;
    }
  | { typ: 'test-ergebnis'; testId: string; note: number }
  // note: die Note, die die Eltern beim Bestätigen gesehen haben (ältere Einträge ohne)
  | { typ: 'test-bestaetigt'; testId: string; note?: number }
  | { typ: 'test-geloescht'; testId: string };

export type Stimmung = 'gut' | 'mittel' | 'schlecht';
export type TestFach = 'englisch' | 'deutsch' | 'mathe' | 'andere';
export type TestArt = 'klassenarbeit' | 'test' | 'vokabeltest';

export type LernEreignis = Basis & EreignisDaten;

export function erstelleEreignis(
  daten: EreignisDaten,
  geraet: string,
  jetzt: Date = new Date(),
): LernEreignis {
  return { id: crypto.randomUUID(), geraet, zeit: jetzt.toISOString(), ...daten };
}

// Zeitlich sortiert, bei gleicher Zeit stabil nach id
export function sortiere(ereignisse: readonly LernEreignis[]): LernEreignis[] {
  return [...ereignisse].sort((a, b) => a.zeit.localeCompare(b.zeit) || a.id.localeCompare(b.id));
}
