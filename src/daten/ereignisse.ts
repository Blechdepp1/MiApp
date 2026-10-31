// Lern-Ereignisse: Jede Aktion wird als Eintrag gespeichert, Punkte und Fortschritt werden daraus berechnet.
// Jedes Gerät schreibt nur eigene Ereignisse; beim Sync werden die Protokolle anhand der id zusammengeführt.

export type Uebung = 'erkennen' | 'waehlen-de-en' | 'schreiben';

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
  | { typ: 'runde-beendet'; richtig: number; mitHilfe: number; verbessert: number }
  | { typ: 'eingeloest'; belohnungId: string; preis: number }
  | { typ: 'bestaetigt'; einloesungId: string };

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
