import type { Vokabel, Vokabelliste } from '../vokabeln-en/typen.ts';

// Lektion = ein Stück Schulstoff (aus Fotos), siehe SPEC 2a.
// Version 1 kennt nur Englisch-Vokabeln; weitere Fächer bringen eigene Inhaltsarten mit.
export type Fach = 'englisch' | 'deutsch' | 'mathe';

export type VokabelInhalt = { art: 'vokabeln'; woerter: Vokabel[] };

// aktiv = wird geübt, pausiert = noch nicht dran, archiviert = fertig, nur noch Wiederholung
export type LektionStatus = 'aktiv' | 'pausiert' | 'archiviert';
export const STATUS: readonly LektionStatus[] = ['aktiv', 'pausiert', 'archiviert'];
export const STATUS_TEXT: Record<LektionStatus, string> = {
  aktiv: 'Gerade dran',
  pausiert: 'Noch nicht dran',
  archiviert: 'Archiv',
};

export type Lektion = {
  id: string;
  // Unbekannte Fächer/Arten (von einer neueren App-Version) werden behalten, aber nicht geübt
  fach: Fach | (string & {});
  titel: string;
  // Datum der Klassenarbeit, z. B. "2026-11-12"
  klassenarbeit?: string;
  erstellt: string;
  geaendert: string;
  // Fehlt bei älteren Lektionen und gilt dann als „aktiv“
  status?: LektionStatus;
  // Position innerhalb von Fach und Status; ohne Angabe nach Erstellungszeit
  reihenfolge?: number;
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
  if (l.status !== undefined && !STATUS.includes(l.status)) return 'Ungültige Daten';
  if (l.reihenfolge !== undefined && !Number.isFinite(l.reihenfolge)) return 'Ungültige Daten';
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

export function statusVon(l: Lektion): LektionStatus {
  return l.status ?? 'aktiv';
}

// Nach Reihenfolge, Lektionen ohne Angabe dahinter in der Reihenfolge ihrer Erstellung
export function sortiereLektionen<T extends Lektion>(lektionen: readonly T[]): T[] {
  return [...lektionen].sort(
    (a, b) =>
      (a.reihenfolge ?? Infinity) - (b.reihenfolge ?? Infinity) ||
      a.erstellt.localeCompare(b.erstellt),
  );
}

// Lektion innerhalb ihrer Gruppe um einen Platz verschieben. Liefert alle Lektionen der Gruppe
// mit neuer, lückenloser Reihenfolge zurück, deren Position sich geändert hat.
export function verschiebe<T extends Lektion>(
  gruppe: readonly T[],
  id: string,
  richtung: -1 | 1,
): T[] {
  const sortiert = sortiereLektionen(gruppe);
  const i = sortiert.findIndex((l) => l.id === id);
  const j = i + richtung;
  if (i < 0 || j < 0 || j >= sortiert.length) return [];
  [sortiert[i], sortiert[j]] = [sortiert[j]!, sortiert[i]!];
  return sortiert.flatMap((l, k) => (l.reihenfolge === k ? [] : [{ ...l, reihenfolge: k }]));
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
