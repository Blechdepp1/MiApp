import type { Vokabel, Vokabelliste } from '../vokabeln-en/typen.ts';

// Lektion = ein Stück Schulstoff (aus Fotos), siehe SPEC 2a.
// Version 1 kennt nur Englisch-Vokabeln; weitere Fächer bringen eigene Inhaltsarten mit.
export type Fach = 'englisch' | 'deutsch' | 'mathe';

export type VokabelInhalt = { art: 'vokabeln'; woerter: Vokabel[] };

export type Lektion = {
  id: string;
  // Unbekannte Fächer/Arten (von einer neueren App-Version) werden behalten, aber nicht geübt
  fach: Fach | (string & {});
  titel: string;
  // Datum der Klassenarbeit, z. B. "2026-11-12"
  klassenarbeit?: string;
  erstellt: string;
  geaendert: string;
  // Gelöschte Lektionen bleiben als Markierung, damit das Löschen auf allen Geräten ankommt
  geloescht?: boolean;
  inhalt: VokabelInhalt | { art: string };
};

export const MAX_TITEL = 60;
// So viele Tage vor der Klassenarbeit wird die Lektion bevorzugt geübt
export const VORRANG_TAGE = 7;

const DATUM = /^\d{4}-\d{2}-\d{2}$/;

function istZeit(wert: unknown): wert is string {
  return typeof wert === 'string' && !Number.isNaN(Date.parse(wert));
}

export function pruefeVokabeln(woerter: unknown): string | null {
  if (!Array.isArray(woerter) || woerter.length === 0)
    return 'Die Lektion braucht mindestens ein Wort.';
  const ids = new Set<string>();
  for (const [i, w] of (woerter as Partial<Vokabel>[]).entries()) {
    if (typeof w?.id !== 'string' || !w.id || ids.has(w.id)) return 'Ungültige Daten';
    ids.add(w.id);
    if (typeof w.en !== 'string' || !w.en.trim() || typeof w.de !== 'string' || !w.de.trim()) {
      return `Wort ${i + 1}: Englisch und Deutsch müssen ausgefüllt sein.`;
    }
  }
  return null;
}

// Gibt einen verständlichen Fehler zurück oder null, wenn die Lektion in Ordnung ist
export function pruefeLektion(wert: unknown): string | null {
  if (typeof wert !== 'object' || wert === null) return 'Ungültige Daten';
  const l = wert as Partial<Lektion>;
  if (typeof l.id !== 'string' || !l.id || typeof l.fach !== 'string' || !l.fach) {
    return 'Ungültige Daten';
  }
  if (!istZeit(l.erstellt) || !istZeit(l.geaendert)) return 'Ungültige Daten';
  if (l.geloescht === true) return null;
  if (typeof l.titel !== 'string' || !l.titel.trim()) return 'Die Lektion braucht einen Titel.';
  if (l.titel.length > MAX_TITEL) return `Titel dürfen höchstens ${MAX_TITEL} Zeichen haben.`;
  if (
    l.klassenarbeit !== undefined &&
    !(typeof l.klassenarbeit === 'string' && DATUM.test(l.klassenarbeit))
  ) {
    return 'Das Datum der Klassenarbeit ist ungültig.';
  }
  if (typeof l.inhalt !== 'object' || l.inhalt === null || typeof l.inhalt.art !== 'string') {
    return 'Ungültige Daten';
  }
  if (l.fach === 'englisch' && l.inhalt.art === 'vokabeln') {
    return pruefeVokabeln((l.inhalt as VokabelInhalt).woerter);
  }
  return null;
}

export function istVokabelLektion(l: Lektion): l is Lektion & { inhalt: VokabelInhalt } {
  return !l.geloescht && l.fach === 'englisch' && l.inhalt.art === 'vokabeln';
}

export function alsVokabelliste(l: Lektion & { inhalt: VokabelInhalt }): Vokabelliste {
  return { id: l.id, name: l.titel, woerter: l.inhalt.woerter };
}

// Steht die Klassenarbeit heute oder in den nächsten Tagen an?
export function hatVorrang(l: Lektion, heute: string, tage = VORRANG_TAGE): boolean {
  if (!l.klassenarbeit || l.geloescht) return false;
  const differenz = (Date.parse(l.klassenarbeit) - Date.parse(heute)) / 86_400_000;
  return differenz >= 0 && differenz <= tage;
}
